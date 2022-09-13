// 创建组件实例
function createComponentInstance(vnode) {
    const component = {
        vnode,
        type: vnode.type,
    };
    return component;
}
// 初始化组件
function setupComponent(instance) {
    // initProps
    // initSlots
    setupStatefulComponent(instance);
}
// 处理有状态的组件
function setupStatefulComponent(instance) {
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
function handleSetupResult(instance, setupResult) {
    if (typeof setupResult === "object") {
        instance.setupState = setupResult;
    }
    finishComponentSetup(instance);
}
function finishComponentSetup(instance) {
    const component = instance.type;
    instance.render = component.render;
}

function render(vnode, container) {
    patch(vnode);
}
function patch(vnode, container) {
    // 需要判断当前的 vnode 是不是 element
    // 如果是一个 element 的话就应该处理 element
    // 如何区分是 组件类型还是 element 类型？？
    // 处理组件
    processComponent(vnode);
}
function processComponent(vnode, container) {
    mountComponent(vnode);
}
function mountComponent(vnode, container) {
    const instance = createComponentInstance(vnode);
    setupComponent(instance);
    setupRenderEffect(instance);
}
function setupRenderEffect(instance, container) {
    // 拿到组件内部  render 函数返回的虚拟节点
    const subTree = instance.render();
    // vnode -> patch
    // vnode -> element -> mountElement
    patch(subTree);
}

function createVnode(type, props, children) {
    const vnode = {
        type,
        props,
        children,
    };
    return vnode;
}

function createApp(rootComponent) {
    return {
        mount(rootContainer) {
            // 根据传进来的  参数 把组件转换成 虚拟节点
            const vnode = createVnode(rootComponent);
            render(vnode);
        },
    };
}

function h(type, props, children) {
    return createVnode(type, props, children);
}

export { createApp, h };
