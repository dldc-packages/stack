import { KeyConsumer } from './Key.ts';
import { INTERNAL } from './constants.ts';

export class MissingContextError extends Error {
  public readonly help?: string;
  constructor(public keyConsumer: KeyConsumer<any>) {
    super(`Cannot find context ${keyConsumer.name}`);
    Object.setPrototypeOf(this, new.target.prototype);
    this.help = keyConsumer[INTERNAL].help;
  }
}
