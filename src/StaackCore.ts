import { KeyConsumer, KeyProvider } from './Key';
import { MissingContextError } from './MissingContextError';
import { DEBUG, INTERNAL, PARENT, PROVIDER } from './constants';

export type StaackCoreTuple = [parent: StaackCore, provider: KeyProvider<any>];

export type StaackCoreValue = StaackCore | null;

export class StaackCore {
  static readonly MissingContextError = MissingContextError;

  private readonly [PARENT]: StaackCoreValue; // Null if root
  private readonly [PROVIDER]: KeyProvider<any>;

  protected constructor(provider: KeyProvider<any>, parent: StaackCoreValue = null) {
    this[PARENT] = parent;
    this[PROVIDER] = provider;
  }

  /**
   * READ Functions
   */

  static findFirstMatch(staack: StaackCoreValue, consumer: KeyConsumer<any, any>): { found: boolean; value: any } {
    if (staack === null) {
      return { found: false, value: null };
    }
    const provider = staack[PROVIDER];
    if (provider[INTERNAL].consumer === consumer) {
      return {
        found: true,
        value: provider[INTERNAL].value,
      };
    }
    return StaackCore.findFirstMatch(staack[PARENT], consumer);
  }

  static has(staack: StaackCoreValue, consumer: KeyConsumer<any, any>): boolean {
    return StaackCore.findFirstMatch(staack, consumer).found;
  }

  static get<T, HasDefault extends boolean>(
    staack: StaackCoreValue,
    consumer: KeyConsumer<T, HasDefault>
  ): HasDefault extends true ? T : T | null {
    const res = StaackCore.findFirstMatch(staack, consumer);
    if (res.found === false) {
      if (consumer[INTERNAL].hasDefault) {
        return consumer[INTERNAL].defaultValue as any;
      }
      return null as any;
    }
    return res.value;
  }

  static getAll<T>(staack: StaackCoreValue, consumer: KeyConsumer<T>): IterableIterator<T> {
    let current: StaackCoreValue = staack;
    return {
      next(): IteratorResult<T> {
        while (current) {
          const provider = current[PROVIDER];
          current = current[PARENT];
          if (provider[INTERNAL].consumer === consumer) {
            return { value: provider[INTERNAL].value, done: false };
          }
        }
        return { value: undefined, done: true };
      },
      [Symbol.iterator]() {
        return this;
      },
    };
  }

  static getOrFail<T>(staack: StaackCoreValue, consumer: KeyConsumer<T>): T {
    const res = StaackCore.findFirstMatch(staack, consumer);
    if (res.found === false) {
      if (consumer[INTERNAL].hasDefault) {
        return consumer[INTERNAL].defaultValue as any;
      }
      throw new MissingContextError(consumer);
    }
    return res.value;
  }

  static extract(staack: StaackCoreValue): IterableIterator<StaackCoreTuple> {
    let current: StaackCoreValue = staack;
    return {
      next(): IteratorResult<StaackCoreTuple> {
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

  static with(staack: StaackCoreValue, ...keys: readonly KeyProvider<any>[]): StaackCoreValue {
    if (keys.length === 0) {
      return staack;
    }
    return [...keys].reduce((parent, provider) => {
      return new StaackCore(provider, parent);
    }, staack);
  }

  /**
   * Merge two StaackCore instances into one.
   * [...left, ...right]
   * If left is empty, return right.
   * If right is empty, return left.
   */
  static merge(left: StaackCoreValue, right: StaackCoreValue): StaackCoreValue {
    if (left === null || right === null) {
      return left ?? right ?? null;
    }
    const rightExtracted = Array.from(StaackCore.extract(right), ([, provider]) => provider).reverse();
    return StaackCore.with(left, ...rightExtracted);
  }

  /**
   * Remove duplicated providers from the StaackCore.
   */
  static dedupe(staack: StaackCoreValue): StaackCoreValue {
    if (staack === null) {
      return null;
    }
    const seenKeys = new Set<KeyConsumer<any>>();
    const queue: KeyProvider<any>[] = [];
    let base: StaackCoreValue = staack;
    let baseQueue: KeyProvider<any>[] = [];
    for (const [item, provider] of StaackCore.extract(staack)) {
      if (seenKeys.has(provider[INTERNAL].consumer)) {
        // we will skip this one in the final result so we reset base
        base = item[PARENT];
        queue.push(...baseQueue);
        baseQueue = [];
        continue;
      }
      seenKeys.add(provider[INTERNAL].consumer);
      baseQueue.push(provider);
    }
    if (base === staack) {
      // no duplicates
      return staack;
    }
    queue.push(...baseQueue);

    return StaackCore.with(base, ...queue.reverse());
  }

  static debug(staack: StaackCoreValue): Array<{ value: any; ctxId: string }> {
    const world: any = globalThis;
    const idMap = world[DEBUG] || (world[DEBUG] = new Map<any, string>());
    const result: Array<{ value: any; ctxName: string; ctxId: string }> = [];
    traverse(staack);
    return result;

    function traverse(staack: StaackCoreValue) {
      if (staack === null) {
        // Root -> stop
        return;
      }
      const provider = staack[PROVIDER];
      const consumer = provider[INTERNAL].consumer;
      let ctxId = idMap.get(consumer);
      if (ctxId === undefined) {
        ctxId = Math.random().toString(36).substring(7);
        idMap.set(consumer, ctxId);
      }
      result.push({
        ctxId,
        ctxName: consumer.name,
        value: provider[INTERNAL].value,
      });
      traverse(staack[PARENT]);
    }
  }
}
