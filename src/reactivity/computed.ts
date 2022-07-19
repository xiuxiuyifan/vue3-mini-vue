import { ReactiveEffect } from "./effect";
class ComputedRefImpl {
  private _getter: any;
  private _dirty: any = true; // 默认值是 true 表示不脏的
  private _value: any;
  private _effect: ReactiveEffect;

  constructor(getter) {
    this._getter = getter;
    // 第一次不会执行 scheduler 函数  ，当 响应式数据被 set 的时候， 不会触发 effect 函数， 而是执行 scheduler 函数
    this._effect = new ReactiveEffect(getter, () => {
      // set 的时候把 标记脏不脏的放开 ，
      if (!this._dirty) {
        this._dirty = true;
      }
    });
  }

  get value() {
    // 用一个变量来标记是否 读取过 computed 的值
    if (this._dirty) {
      this._dirty = false;
      this._value = this._effect.run();
    }
    return this._value;
  }
}

export function computed(getter) {
  return new ComputedRefImpl(getter);
}
