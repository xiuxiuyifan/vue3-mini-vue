'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

function initProps(instance, rawProps) {
    instance.props = rawProps || {};
}

const publicPropertiesMap = {
    $el: (i) => i.vnode.el,
};
const PublicInstanceProxyHandlers = {
    get({ _: instance }, key) {
        // 先从setupState 里面取值
        const { setupState, props } = instance;
        const hasOwn = (val, key) => Object.prototype.hasOwnProperty.call(val, key);
        if (hasOwn(setupState, key)) {
            return setupState[key];
        }
        else if (hasOwn(props, key)) {
            return props[key];
        }
        const publicGetter = publicPropertiesMap[key];
        if (publicGetter) {
            return publicGetter(instance);
        }
    },
};

const extend = Object.assign;
const isObject = (obj) => obj !== null && typeof obj === "object";
//  把 add  转换成  Add
const capitalize = (str) => str.charAt(0).toUpperCase() + str.slice(1);
// 把 add-foo 转换成 addFoo
const camelize = (str) => {
    return str.replace(/-(\w)/g, function (_, c) {
        return c ? c.toUpperCase() : "";
    });
};
const toHandlerKey = (str) => str ? "on" + capitalize(str) : "";

// 存储依赖信息   target key  fn1, fn2
const targetMap = new Map();
// 找出依赖信息依次执行
function trigger(target, key) {
    let depsMap = targetMap.get(target);
    if (!depsMap)
        return;
    let dep = depsMap.get(key);
    triggerEffects(dep);
}
function triggerEffects(dep) {
    for (const effect of dep) {
        if (effect.scheduler) {
            effect.scheduler();
        }
        else {
            effect.run();
        }
    }
}

function createGetter(isReadonly = false, shallow = false) {
    return function get(target, key, receiver) {
        let res = Reflect.get(target, key, receiver);
        if (key === ReactiveFlag.IS_REACTIVE_FLAG) {
            return !isReadonly;
        }
        else if (key === ReactiveFlag.IS_READONLY_FLAG) {
            return isReadonly;
        }
        // 如果是shallow 的则直接 return
        if (shallow) {
            return res;
        }
        //如果得到的是对象，那么还需要递归
        if (isObject(res)) {
            return isReadonly ? readonly(res) : reactive(res);
        }
        return res;
    };
}
function createSetter(isReadonly = false) {
    return function set(target, key, value, receiver) {
        let result = Reflect.set(target, key, value, receiver);
        // 先设置，再触发更新
        if (!isReadonly) {
            trigger(target, key);
        }
        return result;
    };
}
const get = createGetter();
const set = createSetter();
const shallowGet = createGetter(true, true);
const readonlyGetter = createGetter(true);
const reactiveHandler = {
    get,
    set,
};
const readonlyHandler = {
    get: readonlyGetter,
    set(target, key, value, receiver) {
        console.warn(`不能修改 ${String(key)}，因为他是readonly的`);
        return true;
    },
};
const shallowReadonlyHandler = extend({}, readonlyHandler, {
    get: shallowGet,
});

var ReactiveFlag;
(function (ReactiveFlag) {
    ReactiveFlag["IS_REACTIVE_FLAG"] = "__v__isReactive";
    ReactiveFlag["IS_READONLY_FLAG"] = "__v__isReadonly";
})(ReactiveFlag || (ReactiveFlag = {}));
function reactive(raw) {
    return new Proxy(raw, reactiveHandler);
}
function readonly(raw) {
    return new Proxy(raw, readonlyHandler);
}
function shallowReadonly(raw) {
    return new Proxy(raw, shallowReadonlyHandler);
}

function emit(instance, event, ...args) {
    console.log("emit触发了", event);
    // 然后去 props 里面找对应的函数，调用就好了
    const { props } = instance;
    const handlerName = toHandlerKey(camelize(event));
    const handler = props[handlerName];
    handler && handler(...args);
}

// 创建组件实例
function createComponentInstance(vnode) {
    const component = {
        vnode,
        type: vnode.type,
        setupState: {},
        el: null,
        props: {},
        emit: () => { },
    };
    component.emit = emit.bind(null, component);
    return component;
}
// 初始化组件
function setupComponent(instance) {
    // initProps
    initProps(instance, instance.vnode.props);
    // initSlots
    setupStatefulComponent(instance);
}
// 处理有状态的组件
function setupStatefulComponent(instance) {
    const component = instance.type;
    // 给 instance 上面挂一个 proxy 属性，值是一个 proxy 对象
    instance.proxy = new Proxy({ _: instance }, PublicInstanceProxyHandlers);
    const { setup } = component;
    if (setup) {
        const setupResult = setup(shallowReadonly(instance.props), {
            emit: instance.emit,
        });
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
    const { shapeFlag } = vnode;
    if (shapeFlag & 1 /* ShapeFlags.ELEMENT */) {
        processElement(vnode, container);
    }
    else if (shapeFlag & 2 /* ShapeFlags.STATEFUL_COMPONENT */) {
        // 处理组件
        processComponent(vnode, container);
    }
}
function processComponent(vnode, container) {
    mountComponent(vnode, container);
}
/**
 *
 * @param initialVNode 初始化组件的 vnode
 * @param container
 */
function mountComponent(initialVNode, container) {
    const instance = createComponentInstance(initialVNode);
    setupComponent(instance);
    setupRenderEffect(instance, initialVNode, container);
}
function setupRenderEffect(instance, initialVNode, container) {
    const { proxy } = instance;
    // 拿到组件内部  render 函数返回的虚拟节点
    const subTree = instance.render.call(proxy);
    // vnode -> patch
    // vnode -> element -> mountElement
    patch(subTree, container);
    // 把根节点的 el 赋值给组件的虚拟节点
    initialVNode.el = subTree.el;
}
// 处理元素
function processElement(vnode, container) {
    mountElement(vnode, container);
}
// 挂载元素
function mountElement(vnode, container) {
    const el = (vnode.el = document.createElement(vnode.type));
    // vnode.children 可能是 string 也可能是数组
    const { children, shapeFlag } = vnode;
    if (shapeFlag & 4 /* ShapeFlags.TEXT_CHILDREN */) {
        el.textContent = children;
    }
    else if (shapeFlag & 8 /* ShapeFlags.ARRAY_CHILDREN */) {
        mountChildren(vnode, el);
    }
    // props
    const { props } = vnode;
    for (let key in props) {
        let val = props[key];
        const isOn = (key) => /^on[A-Z]/.test(key);
        if (isOn(key)) {
            const event = key.slice(2).toLowerCase();
            el.addEventListener(event, val);
        }
        else {
            el.setAttribute(key, val);
        }
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
        shapeFlag: getShapeFlag(type),
        el: null,
    };
    // 处理 children
    if (typeof vnode.children === "string") {
        vnode.shapeFlag |= 4 /* ShapeFlags.TEXT_CHILDREN */;
    }
    else if (Array.isArray(vnode.children)) {
        vnode.shapeFlag |= 8 /* ShapeFlags.ARRAY_CHILDREN */;
    }
    return vnode;
}
// 如果 type 是 string 的话就表示 vnode 是一个元素  否则就是 有状态组件
function getShapeFlag(type) {
    return typeof type === "string"
        ? 1 /* ShapeFlags.ELEMENT */
        : 2 /* ShapeFlags.STATEFUL_COMPONENT */;
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

exports.createApp = createApp;
exports.h = h;
