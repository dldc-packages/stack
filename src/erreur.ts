import { createErreurStore } from '@dldc/erreur';
import type { TKeyConsumer } from './Key';

const MissingContextErreurInternal = createErreurStore<TKeyConsumer<any>>();

export function throwMissingContextErreur(keyConsumer: TKeyConsumer<any>) {
  return MissingContextErreurInternal.setAndThrow(`Cannot find context ${keyConsumer.name}`, keyConsumer);
}

export const MissingContextErreur = MissingContextErreurInternal.asReadonly;
