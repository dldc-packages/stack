import { describe, expect, test } from 'vitest';
import { Key, Staack, StaackCoreValue } from '../src/mod';

describe('Staack', () => {
  test('Gist', () => {
    // 1. Create a key with a name and a type
    const NumKey = Key.create<number>('Num');

    // 2. Create a stack
    const stack = new Staack();

    // 3. Add a value to the stack using the key (Staack is immutable, it returns a new instance)
    const stack2 = stack.with(NumKey.Provider(42));

    // 4. Get the value from the stack using the key
    expect(stack2.get(NumKey.Consumer)).toBe(42);
  });

  test('new Staack()', () => {
    expect(new Staack()).toBeInstanceOf(Staack);
  });

  test(`Context with 0 should return self`, () => {
    const Ctx = Key.create<string>('Ctx');
    const ctx = new Staack().with(Ctx.Provider(''));
    expect(ctx.with()).toBe(ctx);
  });

  test('Context with default', () => {
    const CtxWithDefault = Key.createWithDefault<string>('CtxWithDefault', 'DEFAULT');
    const emptyCtx = new Staack();
    expect(emptyCtx.get(CtxWithDefault.Consumer)).toBe('DEFAULT');
    expect(emptyCtx.getOrFail(CtxWithDefault.Consumer)).toBe('DEFAULT');
    expect(emptyCtx.has(CtxWithDefault.Consumer)).toBe(false);
    const ctx = emptyCtx.with(CtxWithDefault.Provider('A'));
    expect(ctx.get(CtxWithDefault.Consumer)).toBe('A');
    expect(ctx.getOrFail(CtxWithDefault.Consumer)).toBe('A');
    expect(ctx.has(CtxWithDefault.Consumer)).toBe(true);
    const OtherCtx = Key.create<string>('OtherCtx');
    const otherCtx = emptyCtx.with(OtherCtx.Provider('other'));
    expect(otherCtx.get(CtxWithDefault.Consumer)).toBe('DEFAULT');
    expect(otherCtx.getOrFail(CtxWithDefault.Consumer)).toBe('DEFAULT');
    expect(otherCtx.has(CtxWithDefault.Consumer)).toBe(false);
  });

  test('Context without default', () => {
    const CtxNoDefault = Key.create<string>('CtxNoDefault');
    const emptyCtx = new Staack();
    expect(emptyCtx.get(CtxNoDefault.Consumer)).toBe(null);
    expect(() => emptyCtx.getOrFail(CtxNoDefault.Consumer)).toThrow();
    expect(emptyCtx.has(CtxNoDefault.Consumer)).toBe(false);
    const ctx = emptyCtx.with(CtxNoDefault.Provider('A'));
    expect(ctx.get(CtxNoDefault.Consumer)).toBe('A');
    expect(ctx.getOrFail(CtxNoDefault.Consumer)).toBe('A');
    expect(ctx.has(CtxNoDefault.Consumer)).toBe(true);
  });

  test('Override context', () => {
    const Ctx = Key.create<string>('Ctx');
    const ctx1 = new Staack().with(Ctx.Provider('A'));
    expect(ctx1.get(Ctx.Consumer)).toBe('A');
    const ctx2 = ctx1.with(Ctx.Provider('B'));
    expect(ctx2.get(Ctx.Consumer)).toBe('B');
    const ctx3 = ctx2.with(Ctx.Provider('C'), Ctx.Provider('D'));
    expect(ctx3.get(Ctx.Consumer)).toBe('D');
  });

  test('Staack.getAll()', () => {
    const Ctx1 = Key.create<string>('Ctx1');
    const Ctx2 = Key.create<string>('Ctx2');
    const Ctx3 = Key.create<string>('Ctx3');

    const stack = new Staack().with(
      Ctx1.Provider('1'),
      Ctx2.Provider('2'),
      Ctx3.Provider('3'),
      Ctx1.Provider('1.1'),
      Ctx2.Provider('2.1'),
      Ctx1.Provider('1.2'),
    );

    expect(stack.get(Ctx1.Consumer)).toBe('1.2');
    expect(stack.get(Ctx2.Consumer)).toBe('2.1');
    expect(stack.get(Ctx3.Consumer)).toBe('3');

    expect(Array.from(stack.getAll(Ctx1.Consumer))).toMatchObject(['1.2', '1.1', '1']);
  });

  test('Staack.dedupe()', () => {
    const Ctx1 = Key.create<string>('Ctx1');
    const Ctx2 = Key.create<string>('Ctx2');
    const Ctx3 = Key.create<string>('Ctx3');

    const stack = new Staack()
      .with(
        Ctx1.Provider('1'),
        Ctx2.Provider('2'),
        Ctx3.Provider('3'),
        Ctx1.Provider('1.1'),
        Ctx2.Provider('2.1'),
        Ctx1.Provider('1.2'),
      )
      .dedupe();

    expect(stack.get(Ctx1.Consumer)).toBe('1.2');
    expect(stack.get(Ctx2.Consumer)).toBe('2.1');
    expect(stack.get(Ctx3.Consumer)).toBe('3');
    expect(Array.from(stack.getAll(Ctx1.Consumer))).toMatchObject(['1.2']);

    expect(stack.dedupe()).toBe(stack);
  });
});

test('Custom Staack', () => {
  class CustomStaack extends Staack {
    // You need to override the `instantiate` method to return a new instance of your CustomStack
    protected instantiate(staackCore: StaackCoreValue): this {
      return new CustomStaack(staackCore) as any;
    }
  }

  const custom = new CustomStaack();
  expect(custom instanceof CustomStaack).toBe(true);
  expect(custom instanceof Staack).toBe(true);
  const Ctx = Key.create<string>('Ctx');
  const next = custom.with(Ctx.Provider('ok'));
  expect(next instanceof CustomStaack).toBe(true);
  expect(next instanceof Staack).toBe(true);
});

test('Should throw if custom stack does not override instantiate', () => {
  class CustomStaack extends Staack {}

  const item = new CustomStaack();
  const Ctx = Key.create<string>('Ctx');

  expect(() => item.with(Ctx.Provider('hey'))).toThrow();
});

test('ParamsStaack (with param)', () => {
  class ParamsStaack extends Staack {
    // You can pass your own parameters to the constructor
    constructor(
      public readonly param: string,
      data: StaackCoreValue = null,
    ) {
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

  const Ctx = Key.create<string>('Ctx');
  const next = custom.with(Ctx.Provider('ok'));
  expect(next instanceof ParamsStaack).toBe(true);
  expect(next instanceof Staack).toBe(true);
});

test('Sttack.merge', () => {
  const Key1 = Key.create<string>('Key1');
  const Key2 = Key.create<string>('Key2');

  const base = new Staack().with(Key1.Provider('1'), Key2.Provider('2'));
  const other = new Staack().with(Key1.Provider('1.1'), Key2.Provider('2.1'));

  const merged = base.merge(other);
  expect(merged.get(Key1.Consumer)).toBe('1.1');
  expect(merged.get(Key2.Consumer)).toBe('2.1');

  const merged2 = other.merge(base);
  expect(merged2.get(Key1.Consumer)).toBe('1');
  expect(merged2.get(Key2.Consumer)).toBe('2');

  const mergeEmpty = base.merge(new Staack());
  expect(mergeEmpty).toBe(base);

  const mergeSelf = base.merge(base);
  expect(mergeSelf).toBe(base);
});

test('create empty staack', () => {
  expect(new Staack()).toBeInstanceOf(Staack);
});

test('Debug staack', () => {
  const ACtx = Key.createWithDefault<string>('ACtx', 'A');
  const BCtx = Key.createWithDefault<string>('BCtx', 'B');
  const ctx = new Staack().with(ACtx.Provider('a1'), BCtx.Provider('b1'), ACtx.Provider('a2'));
  const debugValue = ctx.debug();
  expect(debugValue).toMatchObject([
    { value: 'a2', ctxName: 'ACtx' },
    { value: 'b1', ctxName: 'BCtx' },
    { value: 'a1', ctxName: 'ACtx' },
  ]);
  expect(debugValue[0].ctxId).toBe(debugValue[2].ctxId);
});

test('Empty Key', () => {
  const Empty = Key.createEmpty('Empty');

  const ctx = new Staack().with(Empty.Provider());

  expect(ctx.get(Empty.Consumer)).toBe(undefined);
  expect(ctx.has(Empty.Consumer)).toBe(true);
});

test('Undefined value', () => {
  const Empty = Key.create<string | undefined>('Maybe String');

  const ctx = new Staack().with(Empty.Provider(undefined));

  expect(ctx.get(Empty.Consumer)).toBe(undefined);
  expect(ctx.has(Empty.Consumer)).toBe(true);
});
