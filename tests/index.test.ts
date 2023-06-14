import { describe, expect, test } from 'vitest';
import { KeyProvider, Staack, StaackCoreValue, createKey } from '../src/mod';

describe('Staack', () => {
  test('Gist', () => {
    // 1. Create a key with a name and a type
    const NumKey = createKey<number>({ name: 'Num' });

    // 2. Create a stack
    const stack = Staack.create();

    // 3. Add a value to the stack using the key (Staack is immutable, it returns a new instance)
    const stack2 = stack.with(NumKey.Provider(42));

    // 4. Get the value from the stack using the key
    expect(stack2.get(NumKey.Consumer)).toBe(42);
  });

  test('Staack.create()', () => {
    expect(Staack.create()).toBeInstanceOf(Staack);
  });

  test(`Context with 0 should return self`, () => {
    const Ctx = createKey<string>({ name: 'Ctx' });
    const ctx = Staack.create().with(Ctx.Provider(''));
    expect(ctx.with()).toBe(ctx);
  });

  test('Context with default', () => {
    const CtxWithDefault = createKey<string>({
      name: 'CtxWithDefault',
      defaultValue: 'DEFAULT',
    });
    const emptyCtx = Staack.create();
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
    const emptyCtx = Staack.create();
    expect(emptyCtx.get(CtxNoDefault.Consumer)).toBe(null);
    expect(() => emptyCtx.getOrFail(CtxNoDefault.Consumer)).toThrow();
    expect(emptyCtx.has(CtxNoDefault.Consumer)).toBe(false);
    const ctx = emptyCtx.with(CtxNoDefault.Provider('A'));
    expect(ctx.get(CtxNoDefault.Consumer)).toBe('A');
    expect(ctx.getOrFail(CtxNoDefault.Consumer)).toBe('A');
    expect(ctx.has(CtxNoDefault.Consumer)).toBe(true);
  });

  test('Override context', () => {
    const Ctx = createKey<string>({ name: 'Ctx' });
    const ctx1 = Staack.create().with(Ctx.Provider('A'));
    expect(ctx1.get(Ctx.Consumer)).toBe('A');
    const ctx2 = ctx1.with(Ctx.Provider('B'));
    expect(ctx2.get(Ctx.Consumer)).toBe('B');
    const ctx3 = ctx2.with(Ctx.Provider('C'), Ctx.Provider('D'));
    expect(ctx3.get(Ctx.Consumer)).toBe('D');
  });

  test('Staack.getAll()', () => {
    const Ctx1 = createKey<string>({ name: 'Ctx1' });
    const Ctx2 = createKey<string>({ name: 'Ctx2' });
    const Ctx3 = createKey<string>({ name: 'Ctx3' });

    const stack = Staack.create(
      Ctx1.Provider('1'),
      Ctx2.Provider('2'),
      Ctx3.Provider('3'),
      Ctx1.Provider('1.1'),
      Ctx2.Provider('2.1'),
      Ctx1.Provider('1.2')
    );

    expect(stack.get(Ctx1.Consumer)).toBe('1.2');
    expect(stack.get(Ctx2.Consumer)).toBe('2.1');
    expect(stack.get(Ctx3.Consumer)).toBe('3');

    expect(Array.from(stack.getAll(Ctx1.Consumer))).toMatchObject(['1.2', '1.1', '1']);
  });

  test('Staack.dedupe()', () => {
    const Ctx1 = createKey<string>({ name: 'Ctx1' });
    const Ctx2 = createKey<string>({ name: 'Ctx2' });
    const Ctx3 = createKey<string>({ name: 'Ctx3' });

    const stack = Staack.create(
      Ctx1.Provider('1'),
      Ctx2.Provider('2'),
      Ctx3.Provider('3'),
      Ctx1.Provider('1.1'),
      Ctx2.Provider('2.1'),
      Ctx1.Provider('1.2')
    ).dedupe();

    expect(stack.get(Ctx1.Consumer)).toBe('1.2');
    expect(stack.get(Ctx2.Consumer)).toBe('2.1');
    expect(stack.get(Ctx3.Consumer)).toBe('3');
    expect(Array.from(stack.getAll(Ctx1.Consumer))).toMatchObject(['1.2']);

    expect(stack.dedupe()).toBe(stack);
  });
});

test('Custom Staack', () => {
  class CustomStaack extends Staack {
    static create(...keys: KeyProvider<any, boolean>[]): CustomStaack {
      return new CustomStaack().with(...keys);
    }

    // You need to override the `instantiate` method to return a new instance of your CustomStack
    protected instantiate(staackCore: StaackCoreValue): this {
      return new CustomStaack(staackCore) as any;
    }
  }

  const custom = CustomStaack.create();
  expect(custom instanceof CustomStaack).toBe(true);
  expect(custom instanceof Staack).toBe(true);
  const Ctx = createKey<string>({ name: 'Ctx' });
  const next = custom.with(Ctx.Provider('ok'));
  expect(next instanceof CustomStaack).toBe(true);
  expect(next instanceof Staack).toBe(true);
});

test('Should throw if custom stack does not override instantiate', () => {
  class CustomStaack extends Staack {
    static create(): CustomStaack {
      return new CustomStaack();
    }
  }

  const item = CustomStaack.create();
  const Ctx = createKey<string>({ name: 'Ctx' });

  expect(() => item.with(Ctx.Provider('hey'))).toThrow();
});

test('ParamsStaack (with param)', () => {
  class ParamsStaack extends Staack {
    // You can pass your own parameters to the constructor
    constructor(public readonly param: string, data: StaackCoreValue = null) {
      super(data);
    }

    protected instantiate(core: StaackCoreValue): this {
      return new ParamsStaack(this.param, core) as any;
    }
  }

  const custom = new ParamsStaack('some value');
  expect(custom.param).toBe('some value');
  expect(custom instanceof ParamsStaack).toBe(true);
  expect(custom instanceof Staack).toBe(true);

  const Ctx = createKey<string>({ name: 'Ctx' });
  const next = custom.with(Ctx.Provider('ok'));
  expect(next instanceof ParamsStaack).toBe(true);
  expect(next instanceof Staack).toBe(true);
});

test('create empty staack', () => {
  expect(Staack.create()).toBeInstanceOf(Staack);
});

test('Debug staack', () => {
  const ACtx = createKey<string>({ name: 'ACtx', defaultValue: 'A' });
  const BCtx = createKey<string>({ name: 'BCtx', defaultValue: 'B' });
  const ctx = Staack.create().with(ACtx.Provider('a1'), BCtx.Provider('b1'), ACtx.Provider('a2'));
  const debugValue = ctx.debug();
  expect(debugValue).toMatchObject([{ value: 'a2' }, { value: 'b1' }, { value: 'a1' }]);
  expect(debugValue[0].ctxId).toBe(debugValue[2].ctxId);
});
