import { initProps } from "./componentProps";
import { PublicInstanceProxyHandlers } from "./componentPublicInstance";
import { shallowReadonly } from "../reactivity/reactive";
import { emit } from "./componentEmit";
import { initSlots } from "./componentSlots";
import { proxyRefs } from "src/reactivity";
// 创建组件实例
export function createComponentInstance(vnode, parent) {
  const component = {
    vnode,
    type: vnode.type,
    next: null,
    setupState: {},
    el: null,
    props: {},
    slots: {},
    // 取 父级的 provides 属性的值放到自己身上
    provides: parent ? parent.provides : {},
    parent,
    inMounted: false,
    subTree: {},
    emit: () => {},
  };
  component.emit = emit.bind(null, component) as any;

  return component;
}

// 初始化组件

export function setupComponent(instance) {
  // initProps
  initProps(instance, instance.vnode.props);
  initSlots(instance, instance.vnode.children);
  setupStatefulComponent(instance);
}

// 处理有状态的组件
function setupStatefulComponent(instance: any) {
  const component = instance.type;

  // 给 instance 上面挂一个 proxy 属性，值是一个 proxy 对象
  instance.proxy = new Proxy({ _: instance }, PublicInstanceProxyHandlers);

  const { setup } = component;

  if (setup) {
    setCurrentInstance(instance);
    const setupResult = setup(shallowReadonly(instance.props), {
      emit: instance.emit,
    });
    setCurrentInstance(null);

    // 如果 setup 函数返回的是一个函数，则其就是当前组件的render函数
    // 如果是 对象，则就是返回的  render 函数里面的数据
    handleSetupResult(instance, setupResult);
  }
}

// 处理 setup 函数的返回结果
function handleSetupResult(instance, setupResult: any) {
  if (typeof setupResult === "object") {
    // 代理 组件 setup 返回的值
    instance.setupState = proxyRefs(setupResult);
  }

  finishComponentSetup(instance);
}

function finishComponentSetup(instance: any) {
  const component = instance.type;
  instance.render = component.render;
}

let currentInstance = null;

export function getCurrentInstance() {
  return currentInstance;
}

export function setCurrentInstance(instance) {
  currentInstance = instance;
}
