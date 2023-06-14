import { KeyConsumer, KeyProvider } from './Key';
import { MissingContextError } from './MissingContextError';
import { DEBUG, INTERNAL, PARENT, PROVIDER } from './constants';

export type ParentProviderTuple = [parent: Staack, provider: KeyProvider<any>] | [parent: null, provider: null];

export class Staack {
  static readonly MissingContextError = MissingContextError;

  static applyKeys<T extends Staack>(
    instance: T,
    keys: Array<KeyProvider<any>>,
    instantiate: (data: ParentProviderTuple) => T
  ): T {
    if (keys.length === 0) {
      return instance;
    }
    return [...keys].reverse().reduce<T>((parent, provider) => {
      return instantiate([parent, provider]);
    }, instance);
  }

  /**
   * Implementation
   */

  private readonly [PARENT]: Staack | null; // Null if root
  private readonly [PROVIDER]: KeyProvider<any> | null; // Null if root (only)

  protected constructor([parent, provider]: ParentProviderTuple = [null, null]) {
    this[PARENT] = parent;
    this[PROVIDER] = provider;
  }

  static create(...keys: Array<KeyProvider<any>>): Staack {
    return new Staack().with(...keys);
  }

  protected extract(): ParentProviderTuple {
    return [this[PARENT]!, this[PROVIDER]!];
  }

  protected findFirstMatch(consumer: KeyConsumer<any, any>): { found: boolean; value: any } {
    const [parent, provider] = this.extract();
    if (parent === null) {
      return { found: false, value: null };
    }
    if (provider[INTERNAL].consumer === consumer) {
      return {
        found: true,
        value: provider[INTERNAL].value,
      };
    }
    return parent.findFirstMatch(consumer);
  }

  has(ctx: KeyConsumer<any, any>): boolean {
    return this.findFirstMatch(ctx).found;
  }

  get<T, HasDefault extends boolean>(ctx: KeyConsumer<T, HasDefault>): HasDefault extends true ? T : T | null {
    const res = this.findFirstMatch(ctx);
    if (res.found === false) {
      if (ctx[INTERNAL].hasDefault) {
        return ctx[INTERNAL].defaultValue as any;
      }
      return null as any;
    }
    return res.value;
  }

  getOrFail<T>(consumer: KeyConsumer<T>): T {
    const res = this.findFirstMatch(consumer);
    if (res.found === false) {
      if (consumer[INTERNAL].hasDefault) {
        return consumer[INTERNAL].defaultValue as any;
      }
      throw new MissingContextError(consumer);
    }
    return res.value;
  }

  with(...keys: Array<KeyProvider<any>>): Staack {
    return Staack.applyKeys<Staack>(this, keys, (tuple) => new Staack(tuple));
  }

  debug(): Array<{ value: any; ctxId: string }> {
    const world: any = globalThis;
    const idMap = world[DEBUG] || (world[DEBUG] = new Map<any, string>());
    const result: Array<{ value: any; ctxId: string }> = [];
    traverse(this);
    return result;

    function traverse(staack: Staack) {
      const [parent, provider] = staack.extract();
      if (parent === null) {
        // Root -> stop
        return;
      }
      let ctxId = idMap.get(provider[INTERNAL].consumer);
      if (ctxId === undefined) {
        ctxId = Math.random().toString(36).substring(7);
        idMap.set(provider[INTERNAL].consumer, ctxId);
      }
      result.push({
        ctxId,
        value: provider[INTERNAL].value,
      });
      traverse(parent);
    }
  }
}
