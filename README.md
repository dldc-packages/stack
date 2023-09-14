# 🏯 Stack

> A library to create type-safe opaque stacks

## Example

```ts
// 1. Create a key with a name and a type
const NumKey = Key.create<number>('Num');

// 2. Create a stack
const stack = new Stack();

// 3. Add a value to the stack using the key (Stack is immutable, it returns a new instance)
const stack2 = stack.with(NumKey.Provider(42));

// 4. Get the value from the stack using the key
expect(stack2.get(NumKey.Consumer)).toBe(42);
```

## Installation

```bash
npm install stack
# or
yarn add stack
```

## Extending `Stack`

You can create your own `Stack`:

```ts
class CustomStack extends Stack {
  // You need to override the `instantiate` method to return a new instance of your CustomStack
  protected instantiate(stackCore: StackCoreValue): this {
    return new CustomStack(stackCore) as any;
  }
}

const custom = new CustomStack();
expect(custom instanceof CustomStack).toBe(true);
expect(custom instanceof Stack).toBe(true);
```
