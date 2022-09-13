// 创建组件实例
export function createComponentInstance(vnode) {
  const component = {
    vnode,
    type: vnode.type,
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
  if (!component.render) {
    instance.render = component.render;
  }
}
