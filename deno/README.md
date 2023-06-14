# 🏯 Staack

> A library to create type-safe opaque stacks

## Example

```ts
// 1. Create a key with a name and a type
const NumKey = createKey<number>({ name: 'Num' });

// 2. Create a stack
const stack = Staack.create();

// 3. Add a value to the stack using the key (Staack is immutable, it returns a new instance)
const stack2 = stack.with(NumKey.Provider(42));

// 4. Get the value from the stack using the key
expect(stack2.get(NumKey.Consumer)).toBe(42);
```

## Installation

```bash
npm install staack
# or
yarn add staack
```

## Extending `Staack`

You can create your own `Staack`:

```ts
class CustomStaack extends Staack {
  // Override the `create` method to return a new instance of your CustomStack
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
```
