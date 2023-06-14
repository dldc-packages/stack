import { KeyConsumer, KeyProvider } from './Key.ts';
import { MissingContextError } from './MissingContextError.ts';
import { StaackCore, StaackCoreValue } from './StaackCore.ts';
import { INTERNAL } from './constants.ts';

export class Staack {
  static readonly MissingContextError = MissingContextError;

  private readonly [INTERNAL]: StaackCoreValue;

  protected constructor(core: StaackCoreValue = null) {
    this[INTERNAL] = core;
  }

  static create(...keys: Array<KeyProvider<any>>): Staack {
    return new Staack(StaackCore.with(null, ...keys));
  }

  has(consumer: KeyConsumer<any, any>): boolean {
    return StaackCore.has(this[INTERNAL], consumer);
  }

  get<T, HasDefault extends boolean>(consumer: KeyConsumer<T, HasDefault>): HasDefault extends true ? T : T | null {
    return StaackCore.get(this[INTERNAL], consumer);
  }

  getAll<T>(consumer: KeyConsumer<T>): IterableIterator<T> {
    return StaackCore.getAll(this[INTERNAL], consumer);
  }

  getOrFail<T>(consumer: KeyConsumer<T>): T {
    return StaackCore.getOrFail(this[INTERNAL], consumer);
  }

  debug(): Array<{ value: any; ctxId: string }> {
    return StaackCore.debug(this[INTERNAL]);
  }

  protected instantiate(staackCore: StaackCoreValue): this {
    // make sure we are instantiating the same class
    if (this.constructor !== Staack) {
      throw new Error('Cannot instantiate a Staack subclass, you need to override instantiate()');
    }
    return new Staack(staackCore) as any;
  }

  public with(...keys: Array<KeyProvider<any>>): this {
    const nextCore = StaackCore.with(this[INTERNAL], ...keys);
    if (nextCore === this[INTERNAL]) {
      return this;
    }
    return this.instantiate(nextCore);
  }

  public merge(other: Staack): this {
    const nextCore = StaackCore.merge(this[INTERNAL], other[INTERNAL]);
    if (nextCore === this[INTERNAL]) {
      return this;
    }
    return this.instantiate(nextCore);
  }

  public dedupe(): this {
    const nextCore = StaackCore.dedupe(this[INTERNAL]);
    if (nextCore === this[INTERNAL]) {
      return this;
    }
    return this.instantiate(nextCore);
  }
}
