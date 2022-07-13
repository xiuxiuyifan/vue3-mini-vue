import { track, trackEffects, triggerEffects } from "./effect";
import { isObject } from "../shared/index";
import { reactive } from "./reactive";
class RefImpl {
  private _value: any;

  // 依赖函数存放的位置是在  ref 的 deps 属性上
  private deps: Set<any> = new Set();

  private __v_isRef: boolean = true;

  constructor(value) {
    // 在初始化 ref 的时候要判断是不是一个object
    this._value = isObject(value) ? reactive(value) : value;
  }

  get value() {
    // 收集依赖
    trackEffects(this.deps);
    return this._value;
  }

  set value(newValue) {
    this._value = isObject(newValue) ? reactive(newValue) : newValue;
    // 触发依赖
    triggerEffects(this.deps);
  }
}

export function ref(value: any) {
  return new RefImpl(value);
}

// 实现 isRef 和 unRef

export function isRef(ref) {
  return !!ref.__v_isRef;
}

export function unRef(ref) {
  return isRef(ref) ? ref.value : ref;
}

// 实现 proxyRefs

export function proxyRefs(objectWithRefs) {
  return new Proxy(objectWithRefs, {
    get(target, key) {
      return unRef(Reflect.get(target, key));
    },
    set(target, key, value) {
      // 如果原来的值是一个ref 那么重新赋值的时候，就要改原来值的 .value
      if (isRef(target[key]) && !isRef(value)) {
        return (target[key].value = value);
      } else {
        return Reflect.set(target, key, value);
      }
    },
  });
}
