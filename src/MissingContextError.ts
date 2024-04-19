import type { TKeyConsumer } from './Key';

export class MissingContextError extends Error {
  constructor(public keyConsumer: TKeyConsumer<any>) {
    super(`Cannot find context ${keyConsumer.name}`);
    Object.setPrototypeOf(this, new.target.prototype);
  }
}
