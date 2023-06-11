declare const window: any;

export const INTERNAL = Symbol.for('MIID_INTERNAL');
export const MIID_DEBUG = Symbol.for('MIID_DEBUG');

export interface KeyConsumer<T, HasDefault extends boolean = boolean> {
  readonly name: string;
  readonly [INTERNAL]: {
    hasDefault: HasDefault;
    defaultValue: T | undefined;
    help?: string;
  };
}

export interface KeyProvider<T, HasDefault extends boolean = boolean> {
  readonly name: string;
  readonly [INTERNAL]: {
    consumer: KeyConsumer<T, HasDefault>;
    value: T;
  };
}

export type KeyProviderFn<T, HasDefault extends boolean> = (value: T) => KeyProvider<T, HasDefault>;

// Expose both Provider & Consumer because this way you can expose only one of them
export interface Key<T, HasDefault extends boolean = boolean> {
  Consumer: KeyConsumer<T, HasDefault>;
  Provider: KeyProviderFn<T, HasDefault>;
}

export function createKey<T>(options: { name: string; help?: string; defaultValue: T }): Key<T, true>;
export function createKey<T>(options: { name: string; help?: string }): Key<T, false>;
export function createKey<T>(options: { name: string; help?: string; defaultValue?: T }): Key<T, boolean> {
  const { help, name } = options;
  const Consumer: KeyConsumer<T, any> = {
    name,
    [INTERNAL]: {
      hasDefault: options.defaultValue !== undefined,
      defaultValue: options.defaultValue,
      help,
    },
  };
  return {
    Consumer,
    Provider: (value) => ({ name, [INTERNAL]: { value, consumer: Consumer } }),
  };
}

export type StackInternal<Parent extends Stack = Stack> = {
  readonly provider: KeyProvider<any>;
  readonly parent: Parent;
};

export class MissingContextError extends Error {
  public readonly help?: string;
  constructor(public context: KeyConsumer<any>) {
    super(`Cannot find context ${context.name}`);
    Object.setPrototypeOf(this, new.target.prototype);
    this.help = context[INTERNAL].help;
  }
}

export class Stack {
  static readonly MissingContextError = MissingContextError;

  static applyKeys<T extends Stack>(
    instance: T,
    keys: Array<KeyProvider<any>>,
    instantiate: (internal: StackInternal<T>) => T
  ): T {
    if (keys.length === 0) {
      return instance;
    }
    return [...keys].reverse().reduce<T>((parent, provider) => {
      return instantiate({ parent, provider });
    }, instance);
  }

  private readonly [INTERNAL]: StackInternal | null;

  constructor(internal: StackInternal<Stack> | null = null) {
    this[INTERNAL] = internal;
  }

  protected readInternal(consumer: KeyConsumer<any, any>): { found: boolean; value: any } {
    const internal = this[INTERNAL];
    if (internal === null) {
      return {
        found: false,
        value: null,
      };
    }
    if (internal.provider[INTERNAL].consumer === consumer) {
      return {
        found: true,
        value: internal.provider[INTERNAL].value,
      };
    }
    return internal.parent.readInternal(consumer);
  }

  has(ctx: KeyConsumer<any, any>): boolean {
    return this.readInternal(ctx).found;
  }

  get<T, HasDefault extends boolean>(ctx: KeyConsumer<T, HasDefault>): HasDefault extends true ? T : T | null {
    const res = this.readInternal(ctx);
    if (res.found === false) {
      if (ctx[INTERNAL].hasDefault) {
        return ctx[INTERNAL].defaultValue as any;
      }
      return null as any;
    }
    return res.value;
  }

  getOrFail<T>(consumer: KeyConsumer<T>): T {
    const res = this.readInternal(consumer);
    if (res.found === false) {
      if (consumer[INTERNAL].hasDefault) {
        return consumer[INTERNAL].defaultValue as any;
      }
      throw new MissingContextError(consumer);
    }
    return res.value;
  }

  debug(): Array<{ value: any; ctxId: string }> {
    // istanbul ignore next
    const world: any = globalThis;
    const idMap = world[MIID_DEBUG] || new Map<any, string>();
    if (!world[MIID_DEBUG]) {
      world[MIID_DEBUG] = idMap;
    }
    const result: Array<{ value: any; ctxId: string }> = [];
    const traverse = (stack: Stack) => {
      const internal = stack[INTERNAL];
      if (internal === null) {
        return;
      }
      let ctxId = idMap.get(internal.provider[INTERNAL].consumer);
      if (ctxId === undefined) {
        ctxId = Math.random().toString(36).substring(7);
        idMap.set(internal.provider[INTERNAL].consumer, ctxId);
      }
      result.push({
        ctxId,
        value: internal.provider[INTERNAL].value,
      });
      if (internal.parent) {
        traverse(internal.parent);
      }
    };
    traverse(this);
    return result;
  }

  with(...keys: Array<KeyProvider<any>>): Stack {
    return Stack.applyKeys<Stack>(this, keys, (internal) => new Stack(internal));
  }
}

export const StackMixin = {};
