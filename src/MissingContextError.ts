import type { IKeyConsumer } from './Key';

export class MissingContextError extends Error {
  constructor(public keyConsumer: IKeyConsumer<any>) {
    super(`Cannot find context ${keyConsumer.name}`);
    Object.setPrototypeOf(this, new.target.prototype);
  }
}
