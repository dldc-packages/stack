# 🏯 Stack

> A library to create type-safe readonly
> [stacks](https://www.wikiwand.com/en/Stack_(abstract_data_type))

## Example

```ts
import { createKey, Stack } from "@dldc/stack";

// 1. Create a key with a name and a type
const NumKey = createKey<number>("Num");

// 2. Create a stack
const stack = new Stack();

// 3. Add a value to the stack using the key (Stack is immutable, it returns a new instance)
const stack2 = stack.with(NumKey.Provider(42));

// 4. Get the value from the stack using the key
expect(stack2.get(NumKey.Consumer)).toBe(42);
```

## Installation

```bash
deno add jsr:@dldc/stack
```

## Usage

### Defining a `Key`

To write a value to a stack, you need to create a `Key` with a name and a type.

```ts
const NumKey = createKey<number>("Num");
```

A key is a object with three properties:

- `Provider`: a function used to write a value to a stack
- `Consumer`: an object used to read a value from a stack
- `Reset`: an object used to reset a value from a stack

You can also create an empty key that will not have a value:

```ts
const EmptyKey = createEmptyKey("Empty");
```

Note: `get()` will always return `undefined` for an empty key, use `has()` to
check if the key is defined.

Finally you ca define a default value for a key:

```ts
const NumKey = createKeyWithDefault<number>("Num", 42);
```

This key will always return a value if you try to get it from a stack (either
the value that was set or the default value).

### Creating a `Stack`

To create a new empty stack you can instantiate a new `Stack`:

```ts
const stack = new Stack();
```

_Note_: The Stack constructor accept one argument, but you should NEVER use it
as it is an internal implementation detail !

### Writing to a `Stack`

To write a value to a stack, you need to use the `Provider` of a key and pass
it's result to the `with()` method of your `Stack` instance.

```ts
const stack2 = stack.with(NumKey.Provider(42));
```

The `with()` method will return a new instance of `Stack` with the new value.
The original `stack` is not modified.

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
`undefined` if no value was set and the key does not have a default value.

If you expect the Key to be defined you can use the `getOrFail()` method:

```ts
const value = stack.getOrFail(NumKey.Consumer);
```

If the key does not have a default value and no value was set, this will throw
an error.

If you only want to know if a value was set, you can use the `has()` method:

```ts
const hasValue = stack.has(NumKey.Consumer);
```

This will return `true` if a value was set using the `Provider`.

### Resetting a `Stack`

To reset a value from a stack, you need to use the `Reset` of a key and pass it
to the `with()` method of your `Stack` instance.

```ts
const stack2 = stack.with(NumKey.Reset);
```

This will return a new instance of `Stack` with the value removed. The original
`stack` is not modified.

Calling `has()` on a key that was reset will return `false`.

_Note_: The stack will still hold a reference to the previous values, so don't
rely on `Reset` for garbage collection. If you really need to, you can call
`.dedupe()` on the stack to remove all the references to the previous values.

### Debugging a `Stack`

To inspect the content of a stack, you can use the `inspect()` method. It will
return a string representation of the stack.

_Note_: The `toString()` of a `Stack` will always return `Stack { ... }`, if you
want to inspect the content of a stack, you need to use the `inspect()` method.

#### Customizing the `inspect()` method

By default the `inspect()` method will print a serialized version of the values
contained in the stack. You can customize this behavior by providing a
`serialize` function as the last argument of `createKey()` or
`createKeyWithDefault()`.

```ts
const NumKey = createKey<number>("Num", (value) => value.toFixed(2));

const stack = new Stack().with(NumKey.Provider(42));
console.log(stack.inspect());
// Stack { Num: 42.00 }
```

### Handling errors

This library uses [@dldc/erreur](https://jsr.io/@dldc/erreur) to handle errors.

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
