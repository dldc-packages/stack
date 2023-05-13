import { createKey, Stack, StackInternal, KeyProvider } from '../src/mod';

describe('Stack', () => {
  test('new Stack()', () => {
    expect(new Stack()).toBeInstanceOf(Stack);
  });

  test(`Context with 0 should return self`, () => {
    const Ctx = createKey<string>({ name: 'Ctx' });
    const ctx = new Stack().with(Ctx.Provider(''));
    expect(ctx.with()).toBe(ctx);
  });

  test('Context with default', () => {
    const CtxWithDefault = createKey<string>({
      name: 'CtxWithDefault',
      defaultValue: 'DEFAULT',
    });
    const emptyCtx = new Stack();
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
    const emptyCtx = new Stack();
    expect(emptyCtx.get(CtxNoDefault.Consumer)).toBe(null);
    expect(() => emptyCtx.getOrFail(CtxNoDefault.Consumer)).toThrow();
    expect(emptyCtx.has(CtxNoDefault.Consumer)).toBe(false);
    const ctx = emptyCtx.with(CtxNoDefault.Provider('A'));
    expect(ctx.get(CtxNoDefault.Consumer)).toBe('A');
    expect(ctx.getOrFail(CtxNoDefault.Consumer)).toBe('A');
    expect(ctx.has(CtxNoDefault.Consumer)).toBe(true);
  });

  test('Custom Stack', () => {
    class CustomStack extends Stack {
      // You need to override the `with` method to return a new instance of your CustomStack
      with(...keys: Array<KeyProvider<any>>): CustomStack {
        // Use the static `applyKeys` method to apply keys to the current instance
        return Stack.applyKeys<CustomStack>(this, keys, (internal) => new CustomStack(internal));
      }
    }

    const custom = new CustomStack();
    expect(custom instanceof CustomStack).toBe(true);
    expect(custom instanceof Stack).toBe(true);
    const Ctx = createKey<string>({ name: 'Ctx' });
    const next = custom.with(Ctx.Provider('ok'));
    expect(next instanceof CustomStack).toBe(true);
    expect(next instanceof Stack).toBe(true);
  });
});

test('CustomStackWithParams', () => {
  class ParamsStack extends Stack {
    // You can pass your own parameters to the constructor
    constructor(public readonly param: string, internal: StackInternal<ParamsStack> | null = null) {
      super(internal);
    }

    with(...keys: Array<KeyProvider<any>>): ParamsStack {
      return Stack.applyKeys<ParamsStack>(
        this,
        keys,
        (internal) => new ParamsStack(this.param, internal)
      );
    }
  }

  const custom = new ParamsStack('some value');
  expect(custom.param).toBe('some value');
  expect(custom instanceof ParamsStack).toBe(true);
  expect(custom instanceof Stack).toBe(true);
});

test('create empty stack', () => {
  expect(new Stack()).toBeInstanceOf(Stack);
});

test('Debug stack', () => {
  const ACtx = createKey<string>({ name: 'ACtx', defaultValue: 'A' });
  const BCtx = createKey<string>({ name: 'BCtx', defaultValue: 'B' });
  const ctx = new Stack().with(ACtx.Provider('a1'), BCtx.Provider('b1'), ACtx.Provider('a2'));
  expect(ctx.debug()).toMatchObject([{ value: 'a1' }, { value: 'b1' }, { value: 'a2' }]);
});
