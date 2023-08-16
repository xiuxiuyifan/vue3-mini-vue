import { getCurrentInstance } from "./component";

export function provide(key, value) {
  const currentInstance: any = getCurrentInstance();

  if (currentInstance) {
    // 从当前实例上取出 provides
    let { provides } = currentInstance;
    // 再取父级组件的 provides
    const parentProvides = currentInstance.parent.provides;
    // 在第一次未赋值之前 他们都指向父组件的 provides
    if (provides === parentProvides) {
      // 采用原型链，让子组件的 provides 属性的原型指向 父组件的 provides 属性
      provides = currentInstance.provides = Object.create(parentProvides);
    }
    provides[key] = value;
  }
}

export function inject(key, defaultValue) {
  const currentInstance: any = getCurrentInstance();

  // 说明 inject 只能在 setup 函数中使用
  if (currentInstance) {
    const parentProvides = currentInstance.parent.provides;

    if (key in parentProvides) {
      return parentProvides[key];
    } else if (defaultValue) {
      if (typeof defaultValue === "function") {
        return defaultValue();
      }
      return defaultValue;
    }
  }
}
