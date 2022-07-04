import { isObject } from "../shared";
import { track, trigger } from "./effect";
import { reactive, ReactiveFlag, readonly } from "./reactive";
import { extend } from "../shared/index";

function createGetter(isReadonly = false, shallow = false) {
  return function get(target, key, receiver) {
    let res = Reflect.get(target, key, receiver);

    if (key === ReactiveFlag.IS_REACTIVE_FLAG) {
      return !isReadonly;
    } else if (key === ReactiveFlag.IS_READONLY_FLAG) {
      return isReadonly;
    }

    // 如果是shallow 的则直接 return
    if (shallow) {
      return res;
    }
    //先读，再依赖收集
    if (!isReadonly) {
      track(target, key);
    }
    //如果得到的是对象，那么还需要递归
    if (isObject(res)) {
      return isReadonly ? readonly(res) : reactive(res);
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
const shallowGet = createGetter(true, true);

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

export const shallowReadonlyHandler = extend({}, readonlyHandler, {
  get: shallowGet,
});
