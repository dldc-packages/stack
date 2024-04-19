import type { TKeyConsumer, TKeyProvider } from './Key';
import type { TStackCoreValue } from './StackCore';
import { StackCore } from './StackCore';
import { INTERNAL, NODE_INSPECT } from './constants';
import { indent } from './indent';

export class Stack {
  private readonly [INTERNAL]!: TStackCoreValue;

  constructor(core: TStackCoreValue = null) {
    Object.defineProperty(this, INTERNAL, {
      enumerable: false,
      writable: false,
      value: core,
    });
    Object.defineProperty(this, NODE_INSPECT, {
      value: () => this.inspect(),
    });
  }

  public has(consumer: TKeyConsumer<any, any>): boolean {
    return StackCore.has(this[INTERNAL], consumer);
  }

  public get<T, HasDefault extends boolean>(
    consumer: TKeyConsumer<T, HasDefault>,
  ): HasDefault extends true ? T : T | null {
    return StackCore.get(this[INTERNAL], consumer);
  }

  public getAll<T>(consumer: TKeyConsumer<T>): IterableIterator<T> {
    return StackCore.getAll(this[INTERNAL], consumer);
  }

  public getOrFail<T>(consumer: TKeyConsumer<T>): T {
    return StackCore.getOrFail(this[INTERNAL], consumer);
  }

  public inspect() {
    const internal = this[INTERNAL];
    const details = StackCore.inspect(internal);
    if (details === null) {
      return `Stack {}`;
    }
    return [`Stack {`, '  ' + indent(details), `}`].join('\n');
  }

  public toString() {
    return `Stack { ... }`;
  }

  public debug(): Array<{ value: any; ctxId: string }> {
    return StackCore.debug(this[INTERNAL]);
  }

  protected instantiate(stackCore: TStackCoreValue): this {
    // make sure we are instantiating the same class
    if (this.constructor !== Stack) {
      throw new Error('Cannot instantiate a Stack subclass, you need to override instantiate()');
    }
    return new Stack(stackCore) as any;
  }

  public with(...keys: Array<TKeyProvider<any>>): this {
    const nextCore = StackCore.with(this[INTERNAL], ...keys);
    if (nextCore === this[INTERNAL]) {
      return this;
    }
    return this.instantiate(nextCore);
  }

  public merge(other: Stack): this {
    if (other === this) {
      return this;
    }
    const nextCore = StackCore.merge(this[INTERNAL], other[INTERNAL]);
    if (nextCore === this[INTERNAL]) {
      return this;
    }
    return this.instantiate(nextCore);
  }

  public dedupe(): this {
    const nextCore = StackCore.dedupe(this[INTERNAL]);
    if (nextCore === this[INTERNAL]) {
      return this;
    }
    return this.instantiate(nextCore);
  }
}
