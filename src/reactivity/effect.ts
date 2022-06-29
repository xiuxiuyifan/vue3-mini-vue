import { add } from "../index";
// 记录正在执行的effect
let activeEffect: any = null;

// 包装依赖信息
class ReactiveEffect {
  private _fn: any;

  constructor(fn: any) {
    this._fn = fn;
  }

  run() {
    activeEffect = this;
    this._fn();
    activeEffect = null;
  }
}
// 存储依赖信息   target key  fn1, fn2
const targetMap = new Map();

export function track(target, key) {
  let depsMap = targetMap.get(target);

  // 根据 target 取出 target对象的依赖
  if (!depsMap) {
    depsMap = new Map();
    targetMap.set(target, depsMap);
  }

  // 在根据 key 取出 key 的依赖
  let dep = depsMap.get(key);
  if (!dep) {
    dep = new Set();
    depsMap.set(key, dep);
  }
  // 把依赖添加到 dep 的 set 中
  dep.add(activeEffect);
}

// 找出依赖信息依次执行
export function trigger(target, key) {
  let depsMap = targetMap.get(target);
  if (!depsMap) return;

  let dep = depsMap.get(key);

  for (const effect of dep) {
    effect.run();
  }
}

export function effect(fn) {
  const _effect = new ReactiveEffect(fn);

  // 调用effect 传递的这个函数
  _effect.run();
}
