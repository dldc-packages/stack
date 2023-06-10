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
  // You need to override the `with` method to return a new instance of your CustomStaack
  with(...keys: Array<KeyProvider<any>>): CustomStaack {
    // Use the static `applyKeys` method to apply keys to the current instance
    return Staack.applyKeys<CustomStaack>(this, keys, (internal) => new CustomStaack(internal));
  }
}

const custom = new CustomStaack();
expect(custom instanceof CustomStaack).toBe(true);
expect(custom instanceof Staack).toBe(true);
```

If you want to pass custom arguments to yout CustomStaack:

```ts
class ParamsStaack extends Staack {
  // You can pass your own parameters to the constructor
  constructor(public readonly param: string, internal: StaackInternal<ParamsStaack> | null = null) {
    super(internal);
  }

  with(...keys: Array<KeyProvider<any>>): ParamsStaack {
    return Staack.applyKeys<ParamsStaack>(
      this,
      keys,
      (internal) => new ParamsStaack(this.param, internal)
    );
  }
}

const custom = new ParamsStaack('some value');
expect(custom.param).toBe('some value');
expect(custom instanceof ParamsStaack).toBe(true);
expect(custom instanceof Staack).toBe(true);
```
