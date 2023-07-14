import { IKeyConsumer } from './Key';
import { INTERNAL } from './constants';

export class MissingContextError extends Error {
  public readonly help?: string;
  constructor(public keyConsumer: IKeyConsumer<any>) {
    super(`Cannot find context ${keyConsumer.name}`);
    Object.setPrototypeOf(this, new.target.prototype);
    this.help = keyConsumer[INTERNAL].help;
  }
}
