// deno-lint-ignore-file no-explicit-any ban-types

import { createErreurStore, type TErreurStore } from "@dldc/erreur";
import type { TStackCoreValue } from "../mod.ts";
import type { TKeyConsumer } from "./Key.ts";

export interface MissingContextErreurData {
  stack: TStackCoreValue;
  consumer: TKeyConsumer<any, boolean>;
}

const MissingContextErreurInternal: TErreurStore<MissingContextErreurData> =
  createErreurStore();

export function createMissingContextErreur(
  stack: TStackCoreValue,
  consumer: TKeyConsumer<any>
) {
  return MissingContextErreurInternal.setAndThrow(
    `Cannot find context ${consumer.name}`,
    { consumer, stack }
  );
}

export const MissingContextErreur = MissingContextErreurInternal.asReadonly;

export interface InvalidStackSubClassErreurData {
  constructor: Function;
}

const InvalidStackSubClassErreurInternal: TErreurStore<InvalidStackSubClassErreurData> =
  createErreurStore();

export function createInvalidStackSubClassErreur(constructor: Function) {
  return InvalidStackSubClassErreurInternal.setAndThrow(
    "Cannot instantiate a Stack subclass, you need to override instantiate()",
    { constructor }
  );
}

export const InvalidStackSubClassErreur =
  InvalidStackSubClassErreurInternal.asReadonly;
