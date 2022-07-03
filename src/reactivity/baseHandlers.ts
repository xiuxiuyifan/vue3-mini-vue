import { track, trigger } from "./effect";
import { ReactiveFlag } from "./reactive";

function createGetter(isReadonly = false) {
  return function get(target, key, receiver) {
    let res = Reflect.get(target, key, receiver);

    if (key === ReactiveFlag.IS_REACTIVE_FLAG) {
      return !isReadonly;
    } else if (key === ReactiveFlag.IS_READONLY_FLAG) {
      return isReadonly;
    }
    //先读，再依赖收集
    if (!isReadonly) {
      track(target, key);
    }
    return res;
  };
}

function createSetter(isReadonly = false) {
  return function set(target, key, value, receiver) {
    let result = Reflect.set(target, key, value, receiver);
    // 先设置，再触发更新
    if (!isReadonly) {
      trigger(target, key);
    }
    return result;
  };
}

const get = createGetter();
const set = createSetter();

const readonlyGetter = createGetter(true);
export const reactiveHandler = {
  get,
  set,
};

export const readonlyHandler = {
  get: readonlyGetter,
  set(target, key, value, receiver) {
    console.warn(`不能修改 ${String(key)}，因为他是readonly的`);
    return true;
  },
};
