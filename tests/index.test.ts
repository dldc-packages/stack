import { describe, expect, test } from 'vitest';
import type { TStackCoreValue } from '../src/mod';
import { Key, Stack } from '../src/mod';

describe('Stack', () => {
  test('Gist', () => {
    // 1. Create a key with a name and a type
    const NumKey = Key.create<number>('Num');

    // 2. Create a stack
    const stack = new Stack();

    // 3. Add a value to the stack using the key (Stack is immutable, it returns a new instance)
    const stack2 = stack.with(NumKey.Provider(42));

    // 4. Get the value from the stack using the key
    expect(stack2.get(NumKey.Consumer)).toBe(42);
  });

  test('new Stack()', () => {
    expect(new Stack()).toBeInstanceOf(Stack);
  });

  test(`Context with 0 should return self`, () => {
    const Ctx = Key.create<string>('Ctx');
    const ctx = new Stack().with(Ctx.Provider(''));
    expect(ctx.with()).toBe(ctx);
  });

  test('Context with default', () => {
    const CtxWithDefault = Key.createWithDefault<string>('CtxWithDefault', 'DEFAULT');
    const emptyCtx = new Stack();
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
    const emptyCtx = new Stack();
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
    const ctx1 = new Stack().with(Ctx.Provider('A'));
    expect(ctx1.get(Ctx.Consumer)).toBe('A');
    const ctx2 = ctx1.with(Ctx.Provider('B'));
    expect(ctx2.get(Ctx.Consumer)).toBe('B');
    const ctx3 = ctx2.with(Ctx.Provider('C'), Ctx.Provider('D'));
    expect(ctx3.get(Ctx.Consumer)).toBe('D');
  });

  test('Stack.getAll()', () => {
    const Ctx1 = Key.create<string>('Ctx1');
    const Ctx2 = Key.create<string>('Ctx2');
    const Ctx3 = Key.create<string>('Ctx3');

    const stack = new Stack().with(
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

  test('Stack.dedupe()', () => {
    const Ctx1 = Key.create<string>('Ctx1');
    const Ctx2 = Key.create<string>('Ctx2');
    const Ctx3 = Key.create<string>('Ctx3');

    const stack = new Stack()
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

    const empty = new Stack();
    expect(empty.dedupe()).toBe(empty);
  });
});

test('Custom Stack', () => {
  class CustomStack extends Stack {
    // You need to override the `instantiate` method to return a new instance of your CustomStack
    protected instantiate(stackCore: TStackCoreValue): this {
      return new CustomStack(stackCore) as any;
    }
  }

  const custom = new CustomStack();
  expect(custom instanceof CustomStack).toBe(true);
  expect(custom instanceof Stack).toBe(true);
  const Ctx = Key.create<string>('Ctx');
  const next = custom.with(Ctx.Provider('ok'));
  expect(next instanceof CustomStack).toBe(true);
  expect(next instanceof Stack).toBe(true);
});

test('Should throw if custom stack does not override instantiate', () => {
  class CustomStack extends Stack {}

  const item = new CustomStack();
  const Ctx = Key.create<string>('Ctx');

  expect(() => item.with(Ctx.Provider('hey'))).toThrow();
});

test('ParamsStack (with param)', () => {
  class ParamsStack extends Stack {
    // You can pass your own parameters to the constructor
    constructor(
      public readonly param: string,
      data: TStackCoreValue = null,
    ) {
      super(data);
    }

    protected instantiate(core: TStackCoreValue): this {
      return new ParamsStack(this.param, core) as any;
    }
  }

  const custom = new ParamsStack('some value');
  expect(custom.param).toBe('some value');
  expect(custom instanceof ParamsStack).toBe(true);
  expect(custom instanceof Stack).toBe(true);

  const Ctx = Key.create<string>('Ctx');
  const next = custom.with(Ctx.Provider('ok'));
  expect(next instanceof ParamsStack).toBe(true);
  expect(next instanceof Stack).toBe(true);
});

test('Stack.merge', () => {
  const Key1 = Key.create<string>('Key1');
  const Key2 = Key.create<string>('Key2');

  const base = new Stack().with(Key1.Provider('1'), Key2.Provider('2'));
  const other = new Stack().with(Key1.Provider('1.1'), Key2.Provider('2.1'));

  const merged = base.merge(other);
  expect(merged.get(Key1.Consumer)).toBe('1.1');
  expect(merged.get(Key2.Consumer)).toBe('2.1');

  const merged2 = other.merge(base);
  expect(merged2.get(Key1.Consumer)).toBe('1');
  expect(merged2.get(Key2.Consumer)).toBe('2');

  const mergeEmpty = base.merge(new Stack());
  expect(mergeEmpty).toBe(base);

  const mergeSelf = base.merge(base);
  expect(mergeSelf).toBe(base);

  const empty1 = new Stack();
  const empty2 = new Stack();
  const mergeEmpty2 = empty1.merge(empty2);
  expect(mergeEmpty2).toBe(empty1);
});

test('create empty stack', () => {
  expect(new Stack()).toBeInstanceOf(Stack);
});

test('Debug stack', () => {
  const ACtx = Key.createWithDefault<string>('ACtx', 'A');
  const BCtx = Key.createWithDefault<string>('BCtx', 'B');
  const ctx = new Stack().with(ACtx.Provider('a1'), BCtx.Provider('b1'), ACtx.Provider('a2'));
  const debugValue = ctx.debug();
  expect(debugValue).toMatchObject([
    { value: 'a2', ctxName: 'ACtx' },
    { value: 'b1', ctxName: 'BCtx' },
    { value: 'a1', ctxName: 'ACtx' },
  ]);
  expect(debugValue[0].ctxId).toBe(debugValue[2].ctxId);
});

test('Empty Key', () => {
  const EmptyKey = Key.createEmpty('Empty');

  const ctx = new Stack().with(EmptyKey.Provider());

  expect(ctx.get(EmptyKey.Consumer)).toBe(undefined);
  expect(ctx.has(EmptyKey.Consumer)).toBe(true);
});

test('Undefined value', () => {
  const MaybeStringKey = Key.create<string | undefined>('MaybeString');

  const ctx = new Stack().with(MaybeStringKey.Provider(undefined));

  expect(ctx.get(MaybeStringKey.Consumer)).toBe(undefined);
  expect(ctx.has(MaybeStringKey.Consumer)).toBe(true);
});

test('Stack.toString()', () => {
  const MaybeStringKey = Key.create<string | undefined>('MaybeString');
  const ctx = new Stack().with(MaybeStringKey.Provider(undefined));

  expect(ctx.toString()).toBe('Stack { ... }');
});

test('Stack.inspect()', () => {
  const ctx1 = new Stack();
  expect(ctx1.inspect()).toBe('Stack {}');

  const MaybeStringKey = Key.create<string | undefined>('MaybeString');
  const EmptyKey = Key.createEmpty('Empty');
  const ctx = new Stack().with(MaybeStringKey.Provider(undefined), EmptyKey.Provider());

  expect(ctx.inspect()).toBe(`Stack {\n  MaybeString: undefined, Empty: [VOID]\n}`);
});

test('Custom stringify on key', () => {
  const UserKey = Key.create<{ name: string; email: string }>('User');
  const UserPrettyKey = Key.create<{ name: string; email: string }>('User', (user) => `${user.name} <${user.email}>`);

  const ctx = new Stack().with(
    UserKey.Provider({ name: 'John', email: 'john@example.com' }),
    UserPrettyKey.Provider({ name: 'Jenna', email: 'jenna@example.com' }),
  );

  expect(ctx.toString()).toBe('Stack { ... }');
  expect(ctx.inspect()).toBe(
    `Stack {\n  User: {"name":"John","email":"john@example.com"}\n  User: Jenna <jenna@example.com>\n}`,
  );
});

test('Inspect non serializable value', () => {
  const CircularKey = Key.create<any>('Circular');
  const circularValue: any = { a: 1, b: 2 };
  circularValue.circular = circularValue;
  const ctx = new Stack().with(CircularKey.Provider(circularValue));

  expect(ctx.inspect()).toBe(`Stack {\n  Circular: [NOT SERIALIZABLE]\n}`);

  const CircularPrettyKey = Key.create<any>('Circular', ({ a, b }) => {
    return JSON.stringify({ a, b, circular: '[Circular]' });
  });
  const ctx2 = new Stack().with(CircularPrettyKey.Provider(circularValue));
  expect(ctx2.inspect()).toBe(`Stack {\n  Circular: {"a":1,"b":2,"circular":"[Circular]"}\n}`);
});

test('Big object are truncated in inspect', () => {
  const BigObjectKey = Key.create<any>('BigObject');
  const ctx = new Stack().with(
    BigObjectKey.Provider({
      firstKey: 'some long text',
      secondKey: 'some long text',
      thirdKey: 'some long text',
      fourthKey: 'some long text',
    }),
  );
  expect(ctx.inspect()).toBe(`Stack {\n  BigObject: {"firstKey":"some long text","secondKey":"some long text"...\n}`);
});
