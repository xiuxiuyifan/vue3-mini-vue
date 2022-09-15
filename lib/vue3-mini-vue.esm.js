// 创建组件实例
function createComponentInstance(vnode) {
    const component = {
        vnode,
        type: vnode.type,
        setupState: {},
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
    // 给 instance 上面挂一个 proxy 属性，值是一个 proxy 对象
    instance.proxy = new Proxy({}, {
        get(target, key) {
            // 先从setupState 里面取值
            const { setupState } = instance;
            if (key in setupState) {
                return setupState[key];
            }
        },
    });
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
    patch(vnode, container);
}
function patch(vnode, container) {
    // 需要判断当前的 vnode 是不是 element
    // 如果是一个 element 的话就应该处理 element
    // 如何区分是 组件类型还是 element 类型？？
    if (typeof vnode.type === "string") {
        processElement(vnode, container);
    }
    else {
        // 处理组件
        processComponent(vnode, container);
    }
}
function processComponent(vnode, container) {
    mountComponent(vnode, container);
}
function mountComponent(vnode, container) {
    const instance = createComponentInstance(vnode);
    setupComponent(instance);
    setupRenderEffect(instance, container);
}
function setupRenderEffect(instance, container) {
    const { proxy } = instance;
    // 拿到组件内部  render 函数返回的虚拟节点
    const subTree = instance.render.call(proxy);
    // vnode -> patch
    // vnode -> element -> mountElement
    patch(subTree, container);
}
// 处理元素
function processElement(vnode, container) {
    mountElement(vnode, container);
}
// 挂载元素
function mountElement(vnode, container) {
    const el = document.createElement(vnode.type);
    // vnode.children 可能是 string 也可能是数组
    const { children } = vnode;
    if (typeof children === "string") {
        el.textContent = children;
    }
    else if (Array.isArray(children)) {
        debugger;
        mountChildren(vnode, el);
    }
    // props
    const { props } = vnode;
    for (let key in props) {
        let val = props[key];
        el.setAttribute(key, val);
    }
    container.append(el);
}
// 挂载孩子节点
function mountChildren(vnode, container) {
    // 如果孩子是数组就，进行递归的调用，往刚才创建的 根节点下面添加新的元素
    vnode.children.forEach((v) => {
        patch(v, container);
    });
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
            render(vnode, rootContainer);
        },
    };
}

function h(type, props, children) {
    return createVnode(type, props, children);
}

export { createApp, h };
