import { IKeyConsumer, IKeyProvider } from './Key';
import { StaackCore, TStaackCoreValue } from './StaackCore';
import { INTERNAL } from './constants';

export class Staack {
  private readonly [INTERNAL]: TStaackCoreValue;

  constructor(core: TStaackCoreValue = null) {
    this[INTERNAL] = core;
  }

  public has(consumer: IKeyConsumer<any, any>): boolean {
    return StaackCore.has(this[INTERNAL], consumer);
  }

  public get<T, HasDefault extends boolean>(
    consumer: IKeyConsumer<T, HasDefault>,
  ): HasDefault extends true ? T : T | null {
    return StaackCore.get(this[INTERNAL], consumer);
  }

  public getAll<T>(consumer: IKeyConsumer<T>): IterableIterator<T> {
    return StaackCore.getAll(this[INTERNAL], consumer);
  }

  public getOrFail<T>(consumer: IKeyConsumer<T>): T {
    return StaackCore.getOrFail(this[INTERNAL], consumer);
  }

  public debug(): Array<{ value: any; ctxId: string }> {
    return StaackCore.debug(this[INTERNAL]);
  }

  protected instantiate(staackCore: TStaackCoreValue): this {
    // make sure we are instantiating the same class
    if (this.constructor !== Staack) {
      throw new Error('Cannot instantiate a Staack subclass, you need to override instantiate()');
    }
    return new Staack(staackCore) as any;
  }

  public with(...keys: Array<IKeyProvider<any>>): this {
    const nextCore = StaackCore.with(this[INTERNAL], ...keys);
    if (nextCore === this[INTERNAL]) {
      return this;
    }
    return this.instantiate(nextCore);
  }

  public merge(other: Staack): this {
    if (other === this) {
      return this;
    }
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
