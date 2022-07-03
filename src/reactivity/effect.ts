import { add } from "../index";
import { extend } from "../shared/index";
// 记录正在执行的effect
let activeEffect: any = null;
let shouldTrack = false;

// 包装依赖信息
class ReactiveEffect {
  private _fn: any;
  active = true;

  deps = [];
  public onStop?: () => void;
  constructor(fn: any, public scheduler?) {
    this._fn = fn;
  }

  run() {
    // 运行 run 的时候，可以控制 要不要执行后续收集依赖的一步
    // 目前来看的话，只要执行了 fn 那么就默认执行了收集依赖
    // 这里就需要控制了

    // 执行 fn  但是不收集依赖
    if (!this.active) {
      return this._fn();
    }
    // 可以进行收集依赖了
    shouldTrack = true;

    // 记录全局正在执行的依赖
    activeEffect = this;
    let r = this._fn();
    //重置
    shouldTrack = false;
    // activeEffect = null; //???????
    return r;
  }

  stop() {
    // 外部用户如果调用多次，也只会清空一次
    if (this.active) {
      // 清空依赖信息, 清空这个 effect 上面的依赖信息
      cleanupEffect(this);
      if (this.onStop) {
        this.onStop();
      }
      this.active = false;
    }
  }
}

function cleanupEffect(effect: any) {
  effect.deps.forEach((dep: any) => {
    dep.delete(effect);
  });
}

// 存储依赖信息   target key  fn1, fn2
const targetMap = new Map();

export function track(target: any, key: any) {
  // 如果没有正在激活的effect，那么不需要收集依赖
  if (!activeEffect) return;
  // 如果不需要收集依赖，那么不需要收集依赖
  if (!shouldTrack) return;
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

  // dep 用来存放 effect
  activeEffect.deps.push(dep);
}

// 找出依赖信息依次执行
export function trigger(target, key) {
  let depsMap = targetMap.get(target);
  if (!depsMap) return;

  let dep = depsMap.get(key);

  for (const effect of dep) {
    if (effect.scheduler) {
      effect.scheduler();
    } else {
      effect.run();
    }
  }
}

export function effect(fn, options: any = {}) {
  const _effect = new ReactiveEffect(fn);

  // 把传入的参数放到 依赖对象的身上
  extend(_effect, options);
  // 调用effect 传递的这个函数
  _effect.run();

  const runner: any = _effect.run.bind(_effect);
  runner.effect = _effect;
  // 把 run 函数返回出去
  return runner;
}

export function stop(runner) {
  runner.effect.stop();
}
