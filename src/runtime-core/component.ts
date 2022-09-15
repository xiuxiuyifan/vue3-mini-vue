import { PublicInstanceProxyHandlers } from "./componentPublicInstance";
// 创建组件实例
export function createComponentInstance(vnode) {
  const component = {
    vnode,
    type: vnode.type,
    setupState: {},
    el: null,
  };

  return component;
}

// 初始化组件

export function setupComponent(instance) {
  // initProps

  // initSlots

  setupStatefulComponent(instance);
}

// 处理有状态的组件
function setupStatefulComponent(instance: any) {
  const component = instance.type;

  // 给 instance 上面挂一个 proxy 属性，值是一个 proxy 对象
  instance.proxy = new Proxy({ _: instance }, PublicInstanceProxyHandlers);

  const { setup } = component;

  if (setup) {
    const setupResult = setup();

    // 如果 setup 函数返回的是一个函数，则其就是当前组件的render函数
    // 如果是 对象，则就是返回的  render 函数里面的数据
    handleSetupResult(instance, setupResult);
  }
}

// 处理 setup 函数的返回结果
function handleSetupResult(instance, setupResult: any) {
  if (typeof setupResult === "object") {
    instance.setupState = setupResult;
  }

  finishComponentSetup(instance);
}

function finishComponentSetup(instance: any) {
  const component = instance.type;
  instance.render = component.render;
}
