import { track, trigger } from "./effect";
import { readonlyHandler, reactiveHandler } from "./baseHandlers";
export function reactive(raw) {
  return new Proxy(raw, reactiveHandler);
}

export function readonly(raw: any) {
  return new Proxy(raw, readonlyHandler);
}
