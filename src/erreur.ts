// deno-lint-ignore-file no-explicit-any

import { createErreurStore, type TErreurStore } from "erreur";
import type { TKeyConsumer } from "./Key.ts";

const MissingContextErreurInternal: TErreurStore<TKeyConsumer<any, boolean>> =
  createErreurStore<TKeyConsumer<any>>();

export function throwMissingContextErreur(keyConsumer: TKeyConsumer<any>) {
  return MissingContextErreurInternal.setAndThrow(
    `Cannot find context ${keyConsumer.name}`,
    keyConsumer,
  );
}

export const MissingContextErreur = MissingContextErreurInternal.asReadonly;
