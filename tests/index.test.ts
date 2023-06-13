import { describe, expect, test } from 'vitest';
import { KeyProvider, Staack, StaackInternal, createKey } from '../src/mod';

describe('Staack', () => {
  test('new Staack()', () => {
    expect(new Staack()).toBeInstanceOf(Staack);
  });

  test(`Context with 0 should return self`, () => {
    const Ctx = createKey<string>({ name: 'Ctx' });
    const ctx = new Staack().with(Ctx.Provider(''));
    expect(ctx.with()).toBe(ctx);
  });

  test('Context with default', () => {
    const CtxWithDefault = createKey<string>({
      name: 'CtxWithDefault',
      defaultValue: 'DEFAULT',
    });
    const emptyCtx = new Staack();
    expect(emptyCtx.get(CtxWithDefault.Consumer)).toBe('DEFAULT');
    expect(emptyCtx.getOrFail(CtxWithDefault.Consumer)).toBe('DEFAULT');
    expect(emptyCtx.has(CtxWithDefault.Consumer)).toBe(false);
    const ctx = emptyCtx.with(CtxWithDefault.Provider('A'));
    expect(ctx.get(CtxWithDefault.Consumer)).toBe('A');
    expect(ctx.getOrFail(CtxWithDefault.Consumer)).toBe('A');
    expect(ctx.has(CtxWithDefault.Consumer)).toBe(true);
    const OtherCtx = createKey<string>({ name: 'OtherCtx' });
    const otherCtx = emptyCtx.with(OtherCtx.Provider('other'));
    expect(otherCtx.get(CtxWithDefault.Consumer)).toBe('DEFAULT');
    expect(otherCtx.getOrFail(CtxWithDefault.Consumer)).toBe('DEFAULT');
    expect(otherCtx.has(CtxWithDefault.Consumer)).toBe(false);
  });

  test('Context without default', () => {
    const CtxNoDefault = createKey<string>({ name: 'CtxNoDefault' });
    const emptyCtx = new Staack();
    expect(emptyCtx.get(CtxNoDefault.Consumer)).toBe(null);
    expect(() => emptyCtx.getOrFail(CtxNoDefault.Consumer)).toThrow();
    expect(emptyCtx.has(CtxNoDefault.Consumer)).toBe(false);
    const ctx = emptyCtx.with(CtxNoDefault.Provider('A'));
    expect(ctx.get(CtxNoDefault.Consumer)).toBe('A');
    expect(ctx.getOrFail(CtxNoDefault.Consumer)).toBe('A');
    expect(ctx.has(CtxNoDefault.Consumer)).toBe(true);
  });

  test('Custom Staack', () => {
    class CustomStaack extends Staack {
      // You need to override the `with` method to return a new instance of your CustomStack
      with(...keys: Array<KeyProvider<any>>): CustomStaack {
        // Use the static `applyKeys` method to apply keys to the current instance
        return Staack.applyKeys<CustomStaack>(this, keys, (internal) => new CustomStaack(internal));
      }
    }

    const custom = new CustomStaack();
    expect(custom instanceof CustomStaack).toBe(true);
    expect(custom instanceof Staack).toBe(true);
    const Ctx = createKey<string>({ name: 'Ctx' });
    const next = custom.with(Ctx.Provider('ok'));
    expect(next instanceof CustomStaack).toBe(true);
    expect(next instanceof Staack).toBe(true);
  });
});

test('ParamsStaack (with param)', () => {
  class ParamsStaack extends Staack {
    // You can pass your own parameters to the constructor
    constructor(public readonly param: string, internal: StaackInternal<ParamsStaack> | null = null) {
      super(internal);
    }

    with(...keys: Array<KeyProvider<any>>): ParamsStaack {
      return Staack.applyKeys<ParamsStaack>(this, keys, (internal) => new ParamsStaack(this.param, internal));
    }
  }

  const custom = new ParamsStaack('some value');
  expect(custom.param).toBe('some value');
  expect(custom instanceof ParamsStaack).toBe(true);
  expect(custom instanceof Staack).toBe(true);
});

test('create empty staack', () => {
  expect(new Staack()).toBeInstanceOf(Staack);
});

test('Debug staack', () => {
  const ACtx = createKey<string>({ name: 'ACtx', defaultValue: 'A' });
  const BCtx = createKey<string>({ name: 'BCtx', defaultValue: 'B' });
  const ctx = new Staack().with(ACtx.Provider('a1'), BCtx.Provider('b1'), ACtx.Provider('a2'));
  expect(ctx.debug()).toMatchObject([{ value: 'a1' }, { value: 'b1' }, { value: 'a2' }]);
});
