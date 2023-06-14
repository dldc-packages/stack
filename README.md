# 🏯 Staack

> A library to create type-safe opaque stacks

## Example

```ts
// TODO
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
  static create(...keys: KeyProvider<any, boolean>[]): CustomStaack {
    return new CustomStaack().with(...keys);
  }

  // You need to override the `with` method to return a new instance of your CustomStack
  with(...keys: Array<KeyProvider<any>>): CustomStaack {
    // Use the static `applyKeys` method to apply keys to the current instance
    return Staack.applyKeys<CustomStaack>(this, keys, (internal) => new CustomStaack(internal));
  }
}

const custom = CustomStaack.create();
expect(custom instanceof CustomStaack).toBe(true);
expect(custom instanceof Staack).toBe(true);
```
