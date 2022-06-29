import { track, trigger } from "./effect";
export function reactive(raw) {
  return new Proxy(raw, {
    get(target, key, receiver) {
      let res = Reflect.get(target, key, receiver);
      //先读，再依赖收集
      track(target, key);
      return res;
    },
    set(target, key, value, receiver) {
      let result = Reflect.set(target, key, value, receiver);
      // 先设置，再触发更新
      trigger(target, key);
      return result;
    },
  });
}
