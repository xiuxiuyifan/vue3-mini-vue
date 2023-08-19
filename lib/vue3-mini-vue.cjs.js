'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

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
const hasOwn = (val, key) => Object.prototype.hasOwnProperty.call(val, key);

// 记录正在执行的effect
let activeEffect = null;
let shouldTrack = false;
// 包装依赖信息
class ReactiveEffect {
    constructor(fn, scheduler) {
        this.scheduler = scheduler;
        this.active = true;
        this.deps = [];
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
        activeEffect = null; //???????
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
function cleanupEffect(effect) {
    effect.deps.forEach((dep) => {
        dep.delete(effect);
    });
    effect.deps.length = 0;
}
// 存储依赖信息   target key  fn1, fn2
const targetMap = new WeakMap();
function track(target, key) {
    // 如果没有正在激活的effect，那么不需要收集依赖
    if (!activeEffect)
        return;
    // 如果不需要收集依赖，那么不需要收集依赖
    if (!shouldTrack)
        return;
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
    trackEffects(dep);
}
function trackEffects(dep) {
    if (!activeEffect)
        return;
    if (!dep.has(activeEffect)) {
        // 把依赖添加到 dep 的 set 中
        dep.add(activeEffect);
        // dep 用来存放 effect
        activeEffect.deps.push(dep);
    }
}
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
function effect(fn, options = {}) {
    const _effect = new ReactiveEffect(fn);
    // 把传入的参数放到 依赖对象的身上
    extend(_effect, options);
    // 调用effect 传递的这个函数
    _effect.run();
    const runner = _effect.run.bind(_effect);
    runner.effect = _effect;
    // 把 run 函数返回出去
    return runner;
}
function stop(runner) {
    runner.effect.stop();
}

function createGetter(isReadonly = false, shallow = false) {
    return function get(target, key, receiver) {
        let res = Reflect.get(target, key, receiver);
        if (key === exports.ReactiveFlag.IS_REACTIVE_FLAG) {
            return !isReadonly;
        }
        else if (key === exports.ReactiveFlag.IS_READONLY_FLAG) {
            return isReadonly;
        }
        // 如果是shallow 的则直接 return
        if (shallow) {
            return res;
        }
        //先读，再依赖收集
        if (!isReadonly) {
            track(target, key);
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

exports.ReactiveFlag = void 0;
(function (ReactiveFlag) {
    ReactiveFlag["IS_REACTIVE_FLAG"] = "__v__isReactive";
    ReactiveFlag["IS_READONLY_FLAG"] = "__v__isReadonly";
})(exports.ReactiveFlag || (exports.ReactiveFlag = {}));
function reactive(raw) {
    return new Proxy(raw, reactiveHandler);
}
function readonly(raw) {
    return new Proxy(raw, readonlyHandler);
}
function shallowReadonly(raw) {
    return new Proxy(raw, shallowReadonlyHandler);
}
function isReactive(value) {
    // 两个 !! 是将 假值转化为false
    return !!value[exports.ReactiveFlag.IS_REACTIVE_FLAG];
}
function isReadonly(value) {
    return !!value[exports.ReactiveFlag.IS_READONLY_FLAG];
}
function isProxy(raw) {
    return isReactive(raw) || isReadonly(raw);
}

class RefImpl {
    constructor(value) {
        // 依赖函数存放的位置是在  ref 的 deps 属性上
        this.deps = new Set();
        this.__v_isRef = true;
        // 在初始化 ref 的时候要判断是不是一个object
        this._value = isObject(value) ? reactive(value) : value;
    }
    get value() {
        // 收集依赖
        trackEffects(this.deps);
        return this._value;
    }
    set value(newValue) {
        this._value = isObject(newValue) ? reactive(newValue) : newValue;
        // 触发依赖
        triggerEffects(this.deps);
    }
}
function ref(value) {
    return new RefImpl(value);
}
// 实现 isRef 和 unRef
function isRef(ref) {
    return !!ref.__v_isRef;
}
function unRef(ref) {
    return isRef(ref) ? ref.value : ref;
}
// 实现 proxyRefs
function proxyRefs(objectWithRefs) {
    return new Proxy(objectWithRefs, {
        get(target, key) {
            return unRef(Reflect.get(target, key));
        },
        set(target, key, value) {
            // 如果原来的值是一个ref 那么重新赋值的时候，就要改原来值的 .value
            if (isRef(target[key]) && !isRef(value)) {
                return (target[key].value = value);
            }
            else {
                return Reflect.set(target, key, value);
            }
        },
    });
}

class ComputedRefImpl {
    constructor(getter) {
        this._dirty = true; // 默认值是 true 表示不脏的
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
function computed(getter) {
    return new ComputedRefImpl(getter);
}

const Fragment = Symbol("Fragment");
const Text = Symbol("Text");
function createVNode(type, props, children) {
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
    // 如果是有状态组件 并且 children 是 object 那么就是 slot children
    if (vnode.shapeFlag & 2 /* ShapeFlags.STATEFUL_COMPONENT */) {
        if (typeof children === "object") {
            vnode.shapeFlag |= 16 /* ShapeFlags.SLOT_CHILDREN */;
        }
    }
    return vnode;
}
/**
 * 创建文本的虚拟节点
 * @param text
 * @returns
 */
function createTextVNode(text) {
    return createVNode(Text, {}, text);
}
// 如果 type 是 string 的话就表示 vnode 是一个元素  否则就是 有状态组件
function getShapeFlag(type) {
    return typeof type === "string"
        ? 1 /* ShapeFlags.ELEMENT */
        : 2 /* ShapeFlags.STATEFUL_COMPONENT */;
}

function h(type, props, children) {
    return createVNode(type, props, children);
}

function renderSlots(slots, name, props) {
    const slot = slots[name];
    if (slot) {
        if (typeof slot === "function") {
            return createVNode(Fragment, {}, slot(props));
        }
    }
}

function initProps(instance, rawProps) {
    instance.props = rawProps || {};
}

const publicPropertiesMap = {
    $el: (i) => i.vnode.el,
    $slots: (i) => i.slots,
};
const PublicInstanceProxyHandlers = {
    get({ _: instance }, key) {
        // 先从setupState 里面取值
        const { setupState, props } = instance;
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

function emit(instance, event, ...args) {
    console.log("emit触发了", event);
    // 然后去 props 里面找对应的函数，调用就好了
    const { props } = instance;
    const handlerName = toHandlerKey(camelize(event));
    const handler = props[handlerName];
    handler && handler(...args);
}

function initSlots(instance, children) {
    // 把 slots 放到对象里面
    const slots = {};
    const { vnode } = instance;
    // 如果 vnode 的形状里面包含 slot_children，那么
    if (vnode.shapeFlag & 16 /* ShapeFlags.SLOT_CHILDREN */) {
        for (const key in children) {
            const value = children[key];
            slots[key] = (props) => normalizeSlotValue(value(props));
        }
        instance.slots = slots;
    }
}
function normalizeSlotValue(value) {
    return Array.isArray(value) ? value : [value];
}

// 创建组件实例
function createComponentInstance(vnode, parent) {
    const component = {
        vnode,
        type: vnode.type,
        setupState: {},
        el: null,
        props: {},
        slots: {},
        // 取 父级的 provides 属性的值放到自己身上
        provides: parent ? parent.provides : {},
        parent,
        inMounted: false,
        subTree: {},
        emit: () => { },
    };
    component.emit = emit.bind(null, component);
    return component;
}
// 初始化组件
function setupComponent(instance) {
    // initProps
    initProps(instance, instance.vnode.props);
    initSlots(instance, instance.vnode.children);
    setupStatefulComponent(instance);
}
// 处理有状态的组件
function setupStatefulComponent(instance) {
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
function handleSetupResult(instance, setupResult) {
    if (typeof setupResult === "object") {
        // 代理 组件 setup 返回的值
        instance.setupState = proxyRefs(setupResult);
    }
    finishComponentSetup(instance);
}
function finishComponentSetup(instance) {
    const component = instance.type;
    instance.render = component.render;
}
let currentInstance = null;
function getCurrentInstance() {
    return currentInstance;
}
function setCurrentInstance(instance) {
    currentInstance = instance;
}

function provide(key, value) {
    const currentInstance = getCurrentInstance();
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
function inject(key, defaultValue) {
    const currentInstance = getCurrentInstance();
    // 说明 inject 只能在 setup 函数中使用
    if (currentInstance) {
        const parentProvides = currentInstance.parent.provides;
        if (key in parentProvides) {
            return parentProvides[key];
        }
        else if (defaultValue) {
            if (typeof defaultValue === "function") {
                return defaultValue();
            }
            return defaultValue;
        }
    }
}

function createAppAPI(render) {
    return function createApp(rootComponent) {
        return {
            mount(rootContainer) {
                // 根据传进来的  参数 把组件转换成 虚拟节点
                const vnode = createVNode(rootComponent);
                render(vnode, rootContainer);
            },
        };
    };
}

function createRenderer(options) {
    const { createElement: hostCreateElement, patchProp: hostPatchProp, insert: hostInsert, setElementText: hostSetElementText, remove: hostRemove, } = options;
    function render(vnode, container) {
        // patch 根组件的时候 父组件 为 null
        patch(null, vnode, container, null);
    }
    function patch(n1, n2, container, parentComponent) {
        // 需要判断当前的 vnode 是不是 element
        // 如果是一个 element 的话就应该处理 element
        // 如何区分是 组件类型还是 element 类型？？
        const { type, shapeFlag } = n2;
        switch (type) {
            case Fragment:
                processFragment(n1, n2, container, parentComponent);
                break;
            case Text:
                processText(n1, n2, container);
                break;
            default:
                if (shapeFlag & 1 /* ShapeFlags.ELEMENT */) {
                    processElement(n1, n2, container, parentComponent);
                }
                else if (shapeFlag & 2 /* ShapeFlags.STATEFUL_COMPONENT */) {
                    // 处理组件
                    processComponent(n1, n2, container, parentComponent);
                }
                break;
        }
    }
    /**
     * 其实就是只把 children 渲染出来就行
     * @param n2
     * @param container
     */
    function processFragment(n1, n2, container, parentComponent) {
        mountChildren(n2.children, container, parentComponent);
    }
    /**
     * 根据文本虚拟节点创建真实的文本节点
     * @param n2
     * @param container
     */
    function processText(n1, n2, container) {
        // 取出文本内容
        const { children } = n2;
        const textNode = (n2.el = document.createTextNode(children));
        container.append(textNode);
    }
    function processComponent(n1, n2, container, parentComponent) {
        mountComponent(n2, container, parentComponent);
    }
    /**
     *
     * @param initialVNode 初始化组件的 vnode
     * @param container
     */
    function mountComponent(initialVNode, container, parentComponent) {
        const instance = createComponentInstance(initialVNode, parentComponent);
        setupComponent(instance);
        setupRenderEffect(instance, initialVNode, container);
    }
    function setupRenderEffect(instance, initialVNode, container) {
        effect(() => {
            if (!instance.isMounted) {
                console.log("初始化");
                const { proxy } = instance;
                // 拿到组件内部  render 函数返回的虚拟节点
                const subTree = (instance.subTree = instance.render.call(proxy));
                // vnode -> patch
                // vnode -> element -> mountElement
                patch(null, subTree, container, instance);
                // 把根节点的 el 赋值给组件的虚拟节点
                initialVNode.el = subTree.el;
                // 标记组件已经挂载完毕
                instance.isMounted = true;
            }
            else {
                console.log("更新");
                const { proxy } = instance;
                // 最新的 subTree
                const subTree = instance.render.call(proxy);
                // 获取老的 subTree
                const prevSubTree = instance.subTree;
                // 更新老的 subTree
                instance.subTree = subTree;
                console.log("prevSubTree", prevSubTree);
                console.log("subTree", subTree);
                patch(prevSubTree, subTree, container, instance);
            }
        });
    }
    // 处理元素
    function processElement(n1, n2, container, parentComponent) {
        if (!n1) {
            mountElement(n2, container, parentComponent);
        }
        else {
            patchElement(n1, n2, container, parentComponent);
        }
    }
    // 挂载元素
    function mountElement(vnode, container, parentComponent) {
        const el = (vnode.el = hostCreateElement(vnode.type));
        // vnode.children 可能是 string 也可能是数组
        const { children, shapeFlag } = vnode;
        if (shapeFlag & 4 /* ShapeFlags.TEXT_CHILDREN */) {
            el.textContent = children;
        }
        else if (shapeFlag & 8 /* ShapeFlags.ARRAY_CHILDREN */) {
            mountChildren(vnode.children, el, parentComponent);
        }
        // props
        const { props } = vnode;
        for (let key in props) {
            let val = props[key];
            hostPatchProp(el, key, null, val);
        }
        hostInsert(el, container);
    }
    /**
     * 对比新老元素 vnode
     * @param n1
     * @param n2
     * @param container
     */
    function patchElement(n1, n2, container, parentComponent) {
        console.log("patchElement");
        console.log("n1", n1);
        console.log("n2", n2);
        let oldProps = n1.props || {};
        let newProps = n2.props || {};
        // 复用老元素 在同一个 DOM 上面打补丁
        let el = (n2.el = n1.el);
        // 对比孩子
        patchChildren(n1, n2, el, parentComponent);
        // 在对比元素的时候对比 属性
        patchProps(el, oldProps, newProps);
    }
    function patchChildren(n1, n2, el, parentComponent) {
        // 先拿到新节点的 vnode 和 shapeFlag
        const prevShapeFlag = n1.shapeFlag;
        const c1 = n1.children;
        const { shapeFlag } = n2;
        const c2 = n2.children;
        // 新节点是 text
        if (shapeFlag & 4 /* ShapeFlags.TEXT_CHILDREN */) {
            // 老节点就只能有两种情况 text 或者 array
            // 老节点是数组
            if (prevShapeFlag & 8 /* ShapeFlags.ARRAY_CHILDREN */) {
                // 卸载老儿子，并更新文本
                unmountChildren(n1.children);
            }
            // 老节点是文本
            if (c1 !== c2) {
                // 如果不行等则直接更新
                hostSetElementText(el, c2);
            }
        }
        // 新节点是数组
        else {
            // 老节点是 text
            if (prevShapeFlag & 4 /* ShapeFlags.TEXT_CHILDREN */) {
                // 卸载老文本，挂载新节点
                hostSetElementText(el, "");
                // 挂载新儿子节点
                mountChildren(c2, el, parentComponent);
            }
            else {
                console.log("diff 算法");
            }
        }
    }
    /**
     * 删除一组儿子
     * @param children
     */
    function unmountChildren(children) {
        for (let i = 0; i < children.length; i++) {
            const el = children[i].el;
            hostRemove(el);
        }
    }
    function patchProps(el, oldProps, newProps) {
        // 遍历新的属性
        for (let key in newProps) {
            const prevProp = oldProps[key];
            const nextProp = newProps[key];
            // 如果两者不相等就更新 新增或者修改
            if (prevProp !== nextProp) {
                hostPatchProp(el, key, prevProp, nextProp);
            }
        }
        // 遍历老的节点
        for (let key in oldProps) {
            const prevProp = oldProps[key];
            if (!(key in newProps)) {
                // 新的中有，老的中没有则执行删除操作。
                hostPatchProp(el, key, prevProp, null);
            }
        }
    }
    // 挂载孩子节点
    function mountChildren(children, container, parentComponent) {
        // 如果孩子是数组就，进行递归的调用，往刚才创建的 根节点下面添加新的元素
        children.forEach((v) => {
            patch(null, v, container, parentComponent);
        });
    }
    return {
        createApp: createAppAPI(render),
    };
}

function createElement(type) {
    return document.createElement(type);
}
function patchProp(el, key, prevVal, nextVal) {
    const isOn = (key) => /^on[A-Z]/.test(key);
    if (isOn(key)) {
        const event = key.slice(2).toLowerCase();
        el.addEventListener(event, nextVal);
    }
    else {
        // 删除属性
        if (nextVal === undefined || nextVal === null) {
            el.removeAttribute(key);
        }
        else {
            // 修改和添加属性
            el.setAttribute(key, nextVal);
        }
    }
}
function insert(el, parent) {
    parent.append(el);
}
/**
 * 设置元素文本内容
 * @param el
 * @param text
 */
function setElementText(el, text) {
    el.textContent = text;
}
/**
 * 删除DOM 元素的子节点
 * @param child
 */
function remove(child) {
    const parent = child.parentNode;
    if (parent) {
        parent.removeChild(child);
    }
}
const renderer = createRenderer({
    createElement,
    patchProp,
    insert,
    setElementText,
    remove,
});
function createApp(...args) {
    return renderer.createApp(...args);
}

exports.ReactiveEffect = ReactiveEffect;
exports.computed = computed;
exports.createApp = createApp;
exports.createRenderer = createRenderer;
exports.createTextVNode = createTextVNode;
exports.effect = effect;
exports.getCurrentInstance = getCurrentInstance;
exports.h = h;
exports.inject = inject;
exports.isProxy = isProxy;
exports.isReactive = isReactive;
exports.isReadonly = isReadonly;
exports.isRef = isRef;
exports.provide = provide;
exports.proxyRefs = proxyRefs;
exports.reactive = reactive;
exports.readonly = readonly;
exports.ref = ref;
exports.renderSlots = renderSlots;
exports.shallowReadonly = shallowReadonly;
exports.stop = stop;
exports.track = track;
exports.trackEffects = trackEffects;
exports.trigger = trigger;
exports.triggerEffects = triggerEffects;
exports.unRef = unRef;
