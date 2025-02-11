// deno-lint-ignore-file no-explicit-any

import type { TKeyConsumer, TKeyProvider } from "./Key.ts";
import type { TStackCoreValue } from "./StackCore.ts";
import { StackCore } from "./StackCore.ts";
import { INTERNAL, NODE_INSPECT } from "./constants.ts";
import { createInvalidStackSubClassErreur } from "./erreur.ts";
import { indent } from "./indent.ts";

/**
 * This is the main class that you will use to interact with the stack.
 */
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

  public has(consumer: TKeyConsumer<any, boolean>): boolean {
    return StackCore.has(this[INTERNAL], consumer);
  }

  public get<T, HasDefault extends boolean>(
    consumer: TKeyConsumer<T, HasDefault>
  ): HasDefault extends true ? T : T | undefined {
    return StackCore.get(this[INTERNAL], consumer);
  }

  public getAll<T>(consumer: TKeyConsumer<T>): IterableIterator<T> {
    return StackCore.getAll(this[INTERNAL], consumer);
  }

  public getOrFail<T>(consumer: TKeyConsumer<T>): T {
    return StackCore.getOrFail(this[INTERNAL], consumer);
  }

  public inspect(): string {
    const internal = this[INTERNAL];
    const details = StackCore.inspect(internal);
    if (details === null) {
      return `Stack {}`;
    }
    return [`Stack {`, "  " + indent(details), `}`].join("\n");
  }

  public toString(): string {
    return `Stack { ... }`;
  }

  public debug(): Array<{ value: unknown; ctxId: string }> {
    return StackCore.debug(this[INTERNAL]);
  }

  protected instantiate(stackCore: TStackCoreValue): this {
    // make sure we are instantiating the same class
    if (this.constructor !== Stack) {
      throw createInvalidStackSubClassErreur(this.constructor);
    }
    return new Stack(stackCore) as this;
  }

  public with(...keys: Array<TKeyProvider<any>>): this {
    const nextCore = StackCore.with(this[INTERNAL], ...keys);
    if (nextCore === this[INTERNAL]) {
      return this;
    }
    return this.instantiate(nextCore);
  }

  public map<Out extends this>(callbackfn: (input: this) => Out): Out {
    return callbackfn(this);
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
