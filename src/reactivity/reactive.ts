import { track, trigger } from "./effect";
import {
  readonlyHandler,
  reactiveHandler,
  shallowReadonlyHandler,
} from "./baseHandlers";

export enum ReactiveFlag {
  IS_REACTIVE_FLAG = "__v__isReactive",
  IS_READONLY_FLAG = "__v__isReadonly",
}

export function reactive(raw) {
  return new Proxy(raw, reactiveHandler);
}

export function readonly(raw: any) {
  return new Proxy(raw, readonlyHandler);
}

export function shallowReadonly(raw: any) {
  return new Proxy(raw, shallowReadonlyHandler);
}

export function isReactive(value: any) {
  // 两个 !! 是将 假值转化为false
  return !!value[ReactiveFlag.IS_REACTIVE_FLAG];
}

export function isReadonly(value: any) {
  return !!value[ReactiveFlag.IS_READONLY_FLAG];
}

export function isProxy(raw: any) {
  return isReactive(raw) || isReadonly(raw);
}
