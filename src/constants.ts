export const INTERNAL = Symbol.for("dldc.stack.internal");
export const PROVIDER = Symbol.for("dldc.stack.provider");
export const PARENT = Symbol.for("dldc.stack.parent");
export const DEBUG = Symbol.for("dldc.stack.debug");

/**
 * Special symbol to reset a Key.
 * If the latest value is RESET, has() will return false.
 */
export const RESET = Symbol.for("dldc.stack.reset");

export const NODE_INSPECT = Symbol.for("nodejs.util.inspect.custom");
