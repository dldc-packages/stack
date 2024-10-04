# 🏯 Stack

> A library to create type-safe readonly
> [stacks](https://www.wikiwand.com/en/Stack_(abstract_data_type))

## Example

```ts
import { Key, Stack } from "@dldc/stack";

// 1. Create a key with a name and a type
const NumKey = Key.create<number>("Num");

// 2. Create a stack
const stack = new Stack();

// 3. Add a value to the stack using the key (Stack is immutable, it returns a new instance)
const stack2 = stack.with(NumKey.Provider(42));

// 4. Get the value from the stack using the key
expect(stack2.get(NumKey.Consumer)).toBe(42);
```

## Installation

```bash
npm install @dldc/stack
# or
yarn add @dldc/stack
```

## Usage

### Defining a `Key`

To write a value to a stack, you need to create a `Key` with a name and a type.

```ts
const NumKey = Key.create<number>("Num");
```

A key is a object with two properties:

- `Provider`: a function used to write a value to a stack
- `Consumer`: an object used to read a value from a stack

You can also create an empty key that will not have a value:

```ts
const EmptyKey = Key.createEmpty("Empty");
```

Finally you ca define a default value for a key:

```ts
const NumKey = Key.createWithDefault<number>("Num", 42);
```

This key will always return a value if you try to get it from a stack (either
the value that was set or the default value).

### Creating a `Stack`

To create a new empty stack you can instantiate a new `Stack`:

```ts
const stack = new Stack();
```

_Note_: Do not pass any argument to the constructor !

### Writing to a `Stack`

To write a value to a stack, you need to use the `Provider` of a key and pass
it's result to the `with()` method of your `Stack` instance.

```ts
const stack2 = stack.with(NumKey.Provider(42));
```

The `with()` method will return a new instance of `Stack` with the new value.
The original `stack` is not modified.

_Note_: You cannot remove a value from a stack, you can only override it with a
new value.

You can pass multiple providers to the `with()` method:

```ts
const stack2 = stack.with(NumKey.Provider(42), EmptyKey.Provider());
```

### Reading from a `Stack`

To read a value from a stack, you need to use the `Consumer` of a key and pass
it to `get()` method of your `Stack` instance.

```ts
const value = stack.get(NumKey.Consumer);
```

This will return the value that was set using the `Provider` of the key or
`undefined` if no value was setand the key does not have a default value.

If you expect the Key to be defined you can use the `getOrFail()` method:

```ts
const value = stack.getOrFail(NumKey.Consumer);
```

If the key does not have a default value and no value was set, this will throw a
`MissingContextError` error.

If you only want to know if a value was set, you can use the `has()` method:

```ts
const hasValue = stack.has(NumKey.Consumer);
```

This will return `true` if a value was set using the `Provider`.

### Debugging a `Stack`

To inspect the content of a stack, you can use the `inspect()` method. It will
return a string representation of the stack.

_Note_: The `toString()` of a `Stack` will always return `Stack { ... }`, if you
want to inspect the content of a stack, you need to use the `inspect()` method.

#### Customizing the `inspect()` method

By default the `inspect()` method will print a serialized version of the values
contained in the stack. You can customize this behavior by provising a
`serailize` function as the last argument of `Key.create()`, `Key.createEmpty()`
or `Key.createWithDefault()`.

```ts
const NumKey = Key.create<number>("Num", (value) => value.toFixed(2));

const stack = new Stack().with(NumKey.Provider(42));
console.log(stack.inspect());
// Stack { Num: 42.00 }
```

## Extending `Stack` (advanced)

You can create your own `Stack`, this is useful to define custom properties and
methods.

```ts
class CustomStack extends Stack {
  // You need to override the `instantiate` method to return a new instance of your CustomStack
  protected override instantiate(stackCore: StackCoreValue): this {
    return new CustomStack(stackCore) as any;
  }
}

const custom = new CustomStack();
expect(custom instanceof CustomStack).toBe(true);
expect(custom instanceof Stack).toBe(true);
```

For more advanced use cases, see
[the definition of `ZenContext` in `@dldc.serve`](https://github.com/dldc-packages/serve/blob/cd00a571b6e27491cd7bae2fba0b396b1c64d675/src/core/ZenContext.ts)
