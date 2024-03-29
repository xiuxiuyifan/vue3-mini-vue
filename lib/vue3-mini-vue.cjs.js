'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

function toDisplayString(value) {
    return String(value);
}

const extend = Object.assign;
const isObject = (obj) => obj !== null && typeof obj === "object";
const isString = (value) => typeof value === "string";
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

const TO_DISPLAY_STRING = Symbol("toDisplayString");
const CREATE_ELEMENT_VNODE = Symbol("createElementVNode");
const helperMapName = {
    [TO_DISPLAY_STRING]: "toDisplayString",
    [CREATE_ELEMENT_VNODE]: "createElementVNode",
};

/**
 * 根据 ast 生成代码字符串
 * @param ast
 * @returns
 */
function generate(ast) {
    const context = createCodegenContext();
    const { push } = context;
    genFunctionPreamble(ast, context);
    const functionName = "render";
    const args = ["_ctx", "_catch"];
    const signature = args.join(", ");
    push(`function ${functionName}(${signature}){`);
    // 函数体
    push("return ");
    genNode(ast.codegenNode, context);
    push("}");
    return {
        code: context.code,
    };
}
/*
import { toDisplayString as _toDisplayString } from "vue";
function render(_ctx, _cache) {
  return _toDisplayString(_ctx.message);
}
*/
function genFunctionPreamble(ast, context) {
    const { push } = context;
    const VueBinging = "Vue";
    const aliasHelper = (s) => `${helperMapName[s]}: _${helperMapName[s]}`;
    // 如果有 helpers 的时候在添加 导入 helpers
    if (ast.helpers.length > 0) {
        push(`const { ${ast.helpers.map(aliasHelper).join(", ")} } = ${VueBinging}`);
    }
    push("\n");
    push("return ");
}
/**
 * 创建代码生成上下文对象
 * @returns
 */
function createCodegenContext() {
    const context = {
        code: "",
        push(source) {
            context.code += source;
        },
        helper(key) {
            return `_${helperMapName[key]}`;
        },
    };
    return context;
}
function genNode(node, context) {
    switch (node.type) {
        case 3 /* NodeTypes.TEXT */:
            genText(node, context);
            break;
        case 0 /* NodeTypes.INTERPOLATION */:
            genInterpolation(node, context);
            break;
        case 1 /* NodeTypes.SIMPLE_EXPRESSION */:
            genExpression(node, context);
            break;
        case 2 /* NodeTypes.ELEMENT */:
            genElement(node, context);
            break;
        case 5 /* NodeTypes.COMPOUND_EXPRESSION */:
            genCompoundExpression(node, context);
    }
}
function genCompoundExpression(node, context) {
    const { push } = context;
    const children = node.children;
    for (let i = 0; i < children.length; i++) {
        const child = children[i];
        if (isString(child)) {
            push(child);
        }
        else {
            genNode(child, context);
        }
    }
}
function genElement(node, context) {
    const { push, helper } = context;
    const { tag, children, props } = node;
    push(`${helper(CREATE_ELEMENT_VNODE)}(`);
    genNodeList(genNullable([tag, props, children]), context);
    push(")");
}
function genNodeList(nodes, context) {
    const { push } = context;
    for (let i = 0; i < nodes.length; i++) {
        const node = nodes[i];
        if (isString(node)) {
            push(node);
        }
        else {
            genNode(node, context);
        }
        if (i < nodes.length - 1) {
            push(", ");
        }
    }
}
function genNullable(args) {
    return args.map((args) => args || "null");
}
function genExpression(node, context) {
    const { push } = context;
    // 把文件节点的内容放进去
    push(`${node.content}`);
}
function genInterpolation(node, context) {
    const { push, helper } = context;
    push(`${helper(TO_DISPLAY_STRING)}(`);
    genNode(node.content, context);
    push(")");
}
function genText(node, context) {
    const { push } = context;
    push(`'${node.content}'`);
}
// 启发，如果整个程序一直需要 处理某个变量，则可以将当前变量提取成一个对象上下文，并提供对应的增删改查的方法
// 诸如 createCodegenContext 这个函数一样

/**
 *
 * @param content 接受 template 字符串
 */
function baseParse(content) {
    const context = createParserContext(content);
    return createRoot(parseChildren(context, []));
}
function parseChildren(context, ancestors) {
    const nodes = [];
    // 什么时候停止这个循环呢？
    // 没有结束的时候就一直进行循环
    while (!isEnd(context, ancestors)) {
        let node;
        const s = context.source;
        // 解析插值类型
        if (s.startsWith("{{")) {
            // 将 context 交给专门处理插值的函数进行处理
            node = parseInterpolation(context);
        }
        // 元素类型  字符串的开头是 < 开始的
        else if (s[0] === "<") {
            // 再看第一个元素是不是 a-z
            if (/[a-z]/i.test(s[1])) {
                node = parseElement(context, ancestors);
            }
        }
        if (!node) {
            node = parseText(context);
        }
        nodes.push(node);
    }
    return nodes;
}
function isEnd(context, ancestors) {
    // 1. source 有值的时候
    // 2. 遇到结束标签的时候
    const s = context.source;
    // 如果是一个结束标签的话
    if (s.startsWith("</")) {
        for (let i = ancestors.length - 1; i >= 0; i--) {
            const tag = ancestors[i].tag;
            // </div>
            if (startsWithEndTagOpen(s, tag)) {
                return true;
            }
        }
    }
    // if (s && s.startsWith(`</${parentTag}>`)) {
    //   return true;
    // }
    return !s;
}
// 之前是把整个字符串的长度作为结束的位置
function parseText(context) {
    let endIndex = context.source.length;
    let endTokens = ["<", "{{"];
    // 看文本里面，有没有插值
    for (let i = 0; i < endTokens.length; i++) {
        const index = context.source.indexOf(endTokens[i]);
        // 如果有插值的话，则截取到插值的开头位置就好了。
        if (index !== -1 && endIndex > index) {
            // 取最靠近左边的结束标签。最左边的赋值完，后面的就进不来了
            endIndex = index;
        }
    }
    // 获取 content 内容
    const content = parseTextData(context, endIndex);
    return {
        type: 3 /* NodeTypes.TEXT */,
        content,
    };
}
// 获取 一定长度的字符串，并且向前推进
function parseTextData(context, length) {
    // 截取字符串的一部分
    const content = context.source.slice(0, length);
    // 向前推进
    advanceBy(context, length);
    return content;
}
// 解析 元素
function parseElement(context, ancestors) {
    // 先处理元素的开始标签
    const element = parseTag(context, 0 /* TagType.Start */);
    // 收集解析的 元素标签到栈里面
    ancestors.push(element);
    // 处理元素的孩子
    element.children = parseChildren(context, ancestors);
    ancestors.pop();
    // 在处理 元素的结束标签
    // 当前正在处理的标签 和剩下的标签进行一个匹配
    // 如果匹配上了，则进行消费，
    if (startsWithEndTagOpen(context.source, element.tag)) {
        parseTag(context, 1 /* TagType.End */);
    }
    else {
        throw new Error(`缺少结束标签:${element.tag}`);
    }
    return element;
}
function startsWithEndTagOpen(source, tag) {
    return (
    // 以 结束标签开始
    source.startsWith("</") &&
        source.slice(2, 2 + tag.length).toLowerCase() === tag.toLowerCase());
}
function parseTag(context, type) {
    // <div></div>
    const match = /^<\/?([a-z]*)/i.exec(context.source);
    // 拿到 捕获组里面的内容
    const tag = match[1];
    // 删掉已经匹配过的 字符串元素 <div   结束标签也是同理，会进这个逻辑的
    advanceBy(context, match[0].length);
    // 再删掉 >
    advanceBy(context, 1);
    // 如果遇到了结束标签，则直接退出
    if (type === 1 /* TagType.End */)
        return;
    return {
        type: 2 /* NodeTypes.ELEMENT */,
        tag,
    };
}
/**
 * 解析 插值类型
 * @param context 解析上下文对象
 * @returns
 */
function parseInterpolation(context) {
    // {{message}}
    const openDelimiter = "{{";
    const closeDelimiter = "}}";
    // 计算出结束 插值标签的索引位置
    const closeIndex = context.source.indexOf(closeDelimiter, openDelimiter.length);
    // 从插值标签开始向后推进两个
    advanceBy(context, openDelimiter.length);
    // 拿到插值内容的长度
    const rawContentLength = closeIndex - openDelimiter.length;
    // 截取出 原始的差值内容
    const rawContent = parseTextData(context, rawContentLength);
    // 去除两端的空格
    const content = rawContent.trim();
    // 删除掉 已经处理过的位置的元素
    advanceBy(context, closeDelimiter.length);
    // 返回出插值类型节点的 node
    return {
        type: 0 /* NodeTypes.INTERPOLATION */,
        content: {
            type: 1 /* NodeTypes.SIMPLE_EXPRESSION */,
            content: content,
        },
    };
}
/**
 *
 * @param context 正在处理的上下文对象
 * @param length 要截取的字符串长度
 */
function advanceBy(context, length) {
    context.source = context.source.slice(length);
}
function createRoot(children) {
    return {
        children,
        type: 4 /* NodeTypes.ROOT */,
    };
}
function createParserContext(content) {
    return {
        source: content,
    };
}

/**
 *
 * @param root 根节点
 * @param options 传进来的配置参数
 */
function transform(root, options = {}) {
    // 创建一个遍历上下文对象
    const context = createTransformContext(root, options);
    traverseNode(root, context);
    // 返回出用来 生成代码的 ast
    createRootCodegen(root);
    root.helpers = [...context.helpers.keys()];
}
function createRootCodegen(root) {
    const child = root.children[0];
    if (child.type === 2 /* NodeTypes.ELEMENT */) {
        root.codegenNode = child.codegenNode;
    }
    else {
        root.codegenNode = root.children[0];
    }
}
// 创建遍历上下文对象
function createTransformContext(root, options) {
    const context = {
        root,
        nodeTransforms: options.nodeTransforms || [],
        helpers: new Map(),
        helper(key) {
            context.helpers.set(key, 1);
        },
    };
    return context;
}
// 深度优先遍历  ast 树
function traverseNode(node, context) {
    // 先遍历根节点，然后遍历儿子
    // 取出 用户传递的 options 里面的参数
    const nodeTransforms = context.nodeTransforms;
    const exitFns = [];
    for (let i = 0; i < nodeTransforms.length; i++) {
        // 调用用户的函数 ， 把 node 交给用户进行处理
        const transform = nodeTransforms[i];
        const onExit = transform(node, context);
        if (onExit) {
            exitFns.push(onExit);
        }
    }
    switch (node.type) {
        case 0 /* NodeTypes.INTERPOLATION */:
            context.helper(TO_DISPLAY_STRING);
            break;
        case 4 /* NodeTypes.ROOT */:
        case 2 /* NodeTypes.ELEMENT */:
            traverseChildren(node, context);
            break;
    }
    let i = exitFns.length;
    while (i--) {
        exitFns[i]();
    }
}
// 遍历孩子
function traverseChildren(node, context) {
    const children = node.children;
    if (children) {
        for (let i = 0; i < children.length; i++) {
            const childNode = children[i];
            // 继续递归遍历 深度优先遍历
            traverseNode(childNode, context);
        }
    }
}

function createVNodeCall(context, tag, props, children) {
    context.helper(CREATE_ELEMENT_VNODE);
    return {
        type: 2 /* NodeTypes.ELEMENT */,
        tag,
        props,
        children,
    };
}

function transformElement(node, context) {
    if (node.type === 2 /* NodeTypes.ELEMENT */) {
        return () => {
            // tag
            const vnodeTag = `'${node.tag}'`;
            // props
            let vnodeProps;
            // children
            const children = node.children;
            let vnodeChildren = children[0];
            node.codegenNode = createVNodeCall(context, vnodeTag, vnodeProps, vnodeChildren);
        };
    }
}

/**
 * 转换 表达式的 ast
 * @param node
 */
function transformExpression(node) {
    if (node.type === 0 /* NodeTypes.INTERPOLATION */) {
        node.content = processExpression(node.content);
    }
}
// 转换 ast 的 content 属性
function processExpression(node) {
    node.content = `_ctx.${node.content}`;
    return node;
}

function isText(node) {
    return node.type === 3 /* NodeTypes.TEXT */ || node.type === 0 /* NodeTypes.INTERPOLATION */;
}

function transformText(node) {
    if (node.type === 2 /* NodeTypes.ELEMENT */) {
        return () => {
            const { children } = node;
            let currentContainer;
            for (let i = 0; i < children.length; i++) {
                const child = children[i];
                if (isText(child)) {
                    for (let j = i + 1; j < children.length; j++) {
                        const next = children[j];
                        if (isText(next)) {
                            if (!currentContainer) {
                                currentContainer = children[i] = {
                                    type: 5 /* NodeTypes.COMPOUND_EXPRESSION */,
                                    children: [child],
                                };
                            }
                            currentContainer.children.push(" + ");
                            currentContainer.children.push(next);
                            children.splice(j, 1);
                            j--;
                        }
                        else {
                            currentContainer = undefined;
                            break;
                        }
                    }
                }
            }
        };
    }
}

function baseCompile(template) {
    const ast = baseParse(template);
    transform(ast, {
        nodeTransforms: [transformExpression, transformElement, transformText],
    });
    return generate(ast);
}

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
        // 虚拟节点上面添加 用来保存组件实例的属性
        component: null,
        key: props && props.key,
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
    $props: (i) => i.props,
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
    if (compiler && !component.render) {
        if (component.template) {
            component.render = compiler(component.template);
        }
    }
    instance.render = component.render;
}
let currentInstance = null;
function getCurrentInstance() {
    return currentInstance;
}
function setCurrentInstance(instance) {
    currentInstance = instance;
}
let compiler;
function registerRuntimeCompiler(_compiler) {
    compiler = _compiler;
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

function shouldUpdateComponent(prevVNode, nextVNode) {
    // 老组件的 props
    const { props: prevProps } = prevVNode;
    // 新组件的 props
    const { props: nextProps } = nextVNode;
    // 遍历新的属性
    for (const key in nextProps) {
        // 如果新属性的值不等于老属性的值，则表示 属性发生变化了，组件需要更新
        if (nextProps[key] !== prevProps[key]) {
            return true;
        }
    }
    // 不需要更新
    return false;
}

// 接受一个个任务，将其加入到队列里面
const queue = [];
const p = Promise.resolve();
let isFlushPending = false;
// 在 promise 的 then 里面添加要刷新的任务。
function nextTick(fn) {
    return fn ? p.then(fn) : p;
}
function queueJobs(job) {
    // 同步产生的 任务回一直往 队列里面加
    if (!queue.includes(job)) {
        queue.push(job);
    }
    // 然后刷新任务队列
    queueFlush();
}
function queueFlush() {
    // 让刷新的代码值执行一次。
    if (isFlushPending)
        return;
    isFlushPending = true;
    nextTick(flushJobs);
}
function flushJobs() {
    // 真正异步刷新的时候，再将 标示位置 为 true
    isFlushPending = false;
    let job;
    while ((job = queue.shift())) {
        job && job();
    }
}

function createRenderer(options) {
    const { createElement: hostCreateElement, patchProp: hostPatchProp, insert: hostInsert, setElementText: hostSetElementText, remove: hostRemove, } = options;
    function render(vnode, container) {
        // patch 根组件的时候 父组件 为 null
        patch(null, vnode, container, null, null);
    }
    function patch(n1, n2, container, parentComponent, anchor) {
        // 需要判断当前的 vnode 是不是 element
        // 如果是一个 element 的话就应该处理 element
        // 如何区分是 组件类型还是 element 类型？？
        const { type, shapeFlag } = n2;
        switch (type) {
            case Fragment:
                processFragment(n1, n2, container, parentComponent, anchor);
                break;
            case Text:
                processText(n1, n2, container);
                break;
            default:
                if (shapeFlag & 1 /* ShapeFlags.ELEMENT */) {
                    processElement(n1, n2, container, parentComponent, anchor);
                }
                else if (shapeFlag & 2 /* ShapeFlags.STATEFUL_COMPONENT */) {
                    // 处理组件， 组件有一个开箱的过程。
                    processComponent(n1, n2, container, parentComponent, anchor);
                }
                break;
        }
    }
    /**
     * 其实就是只把 children 渲染出来就行
     * @param n2
     * @param container
     */
    function processFragment(n1, n2, container, parentComponent, anchor) {
        mountChildren(n2.children, container, parentComponent, anchor);
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
    // 处理组件也要分 挂载和更新
    function processComponent(n1, n2, container, parentComponent, anchor) {
        if (!n1) {
            mountComponent(n2, container, parentComponent, anchor);
        }
        else {
            updateComponent(n1, n2);
        }
    }
    function updateComponent(n1, n2) {
        // 把老实例给新虚拟节点的实例
        const instance = (n2.component = n1.component);
        // 判断组件是否需要更新
        if (shouldUpdateComponent(n1, n2)) {
            instance.next = n2;
            instance.update();
        }
        else {
            // 组件不需要更新，则不需要执行 update 函数
            n2.el = n1.el;
            instance.vnode = n2;
        }
    }
    /**
     *
     * @param initialVNode 初始化组件的 vnode
     * @param container
     */
    function mountComponent(initialVNode, container, parentComponent, anchor) {
        // 在虚拟节点上保存 组件实例信息
        const instance = (initialVNode.component = createComponentInstance(initialVNode, parentComponent));
        setupComponent(instance);
        setupRenderEffect(instance, initialVNode, container, anchor);
    }
    function setupRenderEffect(instance, initialVNode, container, anchor) {
        // 将副作用函保存到 组件实例身上
        instance.update = effect(() => {
            if (!instance.isMounted) {
                console.log("初始化");
                const { proxy } = instance;
                // 拿到组件内部  render 函数返回的虚拟节点
                const subTree = (instance.subTree = instance.render.call(proxy, proxy));
                // vnode -> patch
                // vnode -> element -> mountElement
                patch(null, subTree, container, instance, anchor);
                // 把根节点的 el 赋值给组件的虚拟节点
                initialVNode.el = subTree.el;
                // 标记组件已经挂载完毕
                instance.isMounted = true;
            }
            else {
                console.log("更新");
                const { next, vnode } = instance;
                if (next) {
                    next.el = vnode.el;
                    // 在组件 重新渲染之前先 根据新的 虚拟节点更新组件的信息，然后渲染的时候拿到的就是最新的组件信息了
                    updateComponentPreRender(instance, next);
                }
                const { proxy } = instance;
                // 最新的 subTree
                const subTree = instance.render.call(proxy, proxy);
                // 获取老的 subTree
                const prevSubTree = instance.subTree;
                // 更新老的 subTree
                instance.subTree = subTree;
                console.log("prevSubTree", prevSubTree);
                console.log("subTree", subTree);
                patch(prevSubTree, subTree, container, instance, anchor);
            }
        }, 
        // 在数据发生变化的时候，不在自动执行  effect 函数，而是执行调度函数
        {
            scheduler() {
                queueJobs(instance.update);
            },
        });
    }
    // 处理元素
    function processElement(n1, n2, container, parentComponent, anchor) {
        if (!n1) {
            mountElement(n2, container, parentComponent, anchor);
        }
        else {
            patchElement(n1, n2, container, parentComponent, anchor);
        }
    }
    // 挂载元素
    function mountElement(vnode, container, parentComponent, anchor) {
        const el = (vnode.el = hostCreateElement(vnode.type));
        // vnode.children 可能是 string 也可能是数组
        const { children, shapeFlag } = vnode;
        if (shapeFlag & 4 /* ShapeFlags.TEXT_CHILDREN */) {
            el.textContent = children;
        }
        else if (shapeFlag & 8 /* ShapeFlags.ARRAY_CHILDREN */) {
            mountChildren(vnode.children, el, parentComponent, anchor);
        }
        // props
        const { props } = vnode;
        for (let key in props) {
            let val = props[key];
            hostPatchProp(el, key, null, val);
        }
        hostInsert(el, container, anchor);
    }
    /**
     * 对比新老元素 vnode
     * @param n1
     * @param n2
     * @param container
     */
    function patchElement(n1, n2, container, parentComponent, anchor) {
        console.log("patchElement");
        console.log("n1", n1);
        console.log("n2", n2);
        let oldProps = n1.props || {};
        let newProps = n2.props || {};
        // 复用老元素 在同一个 DOM 上面打补丁
        let el = (n2.el = n1.el);
        // 对比孩子
        patchChildren(n1, n2, el, parentComponent, anchor);
        // 在对比元素的时候对比 属性
        patchProps(el, oldProps, newProps);
    }
    function patchChildren(n1, n2, el, parentComponent, anchor) {
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
                mountChildren(c2, el, parentComponent, anchor);
            }
            else {
                patchKeyedChildren(c1, c2, el, parentComponent, anchor);
            }
        }
    }
    /**
     *
     * @param c1 老子节点
     * @param c2 新子节点
     * @param container
     * @param parentComponent
     * @param parentAnchor
     */
    function patchKeyedChildren(c1, c2, container, parentComponent, anchor) {
        const l2 = c2.length;
        let i = 0;
        let e1 = c1.length - 1;
        let e2 = l2 - 1;
        function isSameVNodeType(n1, n2) {
            return n1.type === n2.type && n1.key === n2.key;
        }
        // 从左侧开始进行对比
        while (i <= e1 && i <= e2) {
            const n1 = c1[i];
            const n2 = c2[i];
            // 如果相等则 继续比较当前节点
            if (isSameVNodeType(n1, n2)) {
                patch(n1, n2, container, parentComponent, anchor);
            }
            else {
                // 如果遇到不相等的，则进行下一项比较
                break;
            }
            i++;
        }
        console.log(`前前对比结束`, i, e1, e2);
        while (i <= e1 && i <= e2) {
            const n1 = c1[e1];
            const n2 = c2[e2];
            if (isSameVNodeType(n1, n2)) {
                patch(n1, n2, container, parentComponent, anchor);
            }
            else {
                break;
            }
            e1--;
            e2--;
        }
        console.log(`后后对比结束`, i, e1, e2);
        if (i > e1) {
            // 新的比老的多
            // 这个区间代表了多出来的元素
            // 新的
            if (i <= e2) {
                // 新节点尾部位置 + 1
                const nextPos = e2 + 1;
                // 寻找参照点
                // 前面新增和后面新增的两种情况
                // 找到参考点一直传下去
                const anchor = nextPos < l2 ? c2[nextPos].el : null;
                while (i <= e2) {
                    patch(null, c2[i], container, parentComponent, anchor);
                    i++;
                }
            }
        }
        else if (i > e2) {
            // 老的比新的多
            // 要删除的区间就是 [i, e1] 之间的元素
            while (i <= e1) {
                hostRemove(c1[i].el);
                i++;
            }
        }
        else {
            console.log("中间对比");
            let s1 = i;
            let s2 = i;
            // 将要对比的中间差异元素的个数
            const toBePatched = e2 - s2 + 1;
            // 新老节点相同的，已经深度patch过的元素
            let patched = 0;
            // 用新元素的 key 和下标构建一个 Map 对象
            const keyToNewIndexMap = new Map();
            // 用一个 map 来收集 差异节点中新节点在老节点中的位置
            const newIndexToOldIndexMap = new Array(toBePatched); // 初始化长度等于新元素
            // 记录 元素是否移动位置
            let moved = false;
            let maxNewIndexSoFar = 0;
            // 先给每一个初始化为 0
            for (let i = 0; i < toBePatched; i++) {
                newIndexToOldIndexMap[i] = 0;
            }
            // 遍历新元素中间剩余的
            for (let i = s2; i <= e2; i++) {
                const nextChild = c2[i];
                keyToNewIndexMap.set(nextChild.key, i);
            }
            // 遍历老的元素，看老的元素是否在新的元素中出现。
            for (let i = s1; i <= e1; i++) {
                const prevChild = c1[i];
                if (patched >= toBePatched) {
                    // 移除老的元素
                    hostRemove(prevChild.el);
                    continue;
                }
                let newIndex;
                // 如果老的 vnode 里面有 key，则去新节点构建的 map 中去查找
                // null 和 undefined
                if (prevChild.key != null) {
                    newIndex = keyToNewIndexMap.get(prevChild.key);
                }
                else {
                    // 如果没有可以，则进行双重循环对比 n²
                    // 遍历新的节点
                    for (let j = s2; j <= e2; j++) {
                        if (isSameVNodeType(prevChild, e2[j])) {
                            newIndex = j;
                            break;
                        }
                    }
                }
                // 如果老节点在新节点中不存在，则将其移除掉
                if (newIndex === undefined) {
                    hostRemove(prevChild.el);
                }
                else {
                    // 老节点中存在，新节点中也存在
                    // 如果 新节点一直大于迄今为止最大的索引，则说明没有元素位置发生了变化
                    if (newIndex >= maxNewIndexSoFar) {
                        // 更新当前最大的索引值
                        maxNewIndexSoFar = newIndex;
                    }
                    else {
                        // 如果一旦有小于最大的索引，则说明元素位置发生了变化
                        moved = true;
                    }
                    newIndexToOldIndexMap[newIndex - s2] = i + 1; // i 代表 新节点在老节点中的位置。
                    patch(prevChild, c2[newIndex], container, parentComponent, null);
                    patched++;
                }
            }
            // 老元素对比完成之后，看看是否有要移动的元素，如果有，则需要用新元素在老元素中的位置求出，最大递增子序列
            const increasingNewIndexSequence = moved
                ? getSequence(newIndexToOldIndexMap)
                : [];
            // 取出最长递增子序列的最后一位
            let j = increasingNewIndexSequence.length - 1;
            // 倒序遍历中间的差异元素
            for (let i = toBePatched - 1; i >= 0; i--) {
                // 当前遍历元素在新节点中的位置索引
                const nextIndex = i + s2;
                const nextChild = c2[nextIndex];
                // 计算插入 的参考点。
                // 要插入元素位置就是在当前元素的下一个元素之前，
                const anchor = nextIndex + 1 < l2 ? c2[nextIndex + 1].el : null;
                if (newIndexToOldIndexMap[i] === 0) {
                    // 表示新增元素
                    patch(null, nextChild, container, parentComponent, anchor);
                }
                else if (moved) {
                    // 从后往前 遍历到的元素不是最长递增子序列里面的元素
                    if (j < 0 || i !== increasingNewIndexSequence[j]) {
                        // 需要移动当前新的节点
                        hostInsert(nextChild.el, container, anchor);
                    }
                    else {
                        // 不需要移动元素
                        j--;
                    }
                }
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
    function mountChildren(children, container, parentComponent, anchor) {
        // 如果孩子是数组就，进行递归的调用，往刚才创建的 根节点下面添加新的元素
        children.forEach((v) => {
            patch(null, v, container, parentComponent, anchor);
        });
    }
    return {
        createApp: createAppAPI(render),
    };
}
function updateComponentPreRender(instance, nextVNode) {
    instance.vnode = nextVNode;
    instance.next = null;
    instance.props = nextVNode.props;
}
function getSequence(arr) {
    const p = arr.slice();
    const result = [0];
    let i, j, u, v, c;
    const len = arr.length;
    for (i = 0; i < len; i++) {
        const arrI = arr[i];
        if (arrI !== 0) {
            j = result[result.length - 1];
            if (arr[j] < arrI) {
                p[i] = j;
                result.push(i);
                continue;
            }
            u = 0;
            v = result.length - 1;
            while (u < v) {
                c = (u + v) >> 1;
                if (arr[result[c]] < arrI) {
                    u = c + 1;
                }
                else {
                    v = c;
                }
            }
            if (arrI < arr[result[u]]) {
                if (u > 0) {
                    p[i] = result[u - 1];
                }
                result[u] = i;
            }
        }
    }
    u = result.length;
    v = result[u - 1];
    while (u-- > 0) {
        result[u] = v;
        v = p[v];
    }
    return result;
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
/**
 *
 * @param child
 * @param parent
 * @param anchor 参照点位 null 的话就是向后插入，如果不为 null 的话，则表示向参照点前面插入新元素
 */
function insert(child, parent, anchor) {
    parent.insertBefore(child, anchor || null);
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

var runtimeDom = /*#__PURE__*/Object.freeze({
    __proto__: null,
    createApp: createApp,
    h: h,
    renderSlots: renderSlots,
    createTextVNode: createTextVNode,
    createElementVNode: createVNode,
    getCurrentInstance: getCurrentInstance,
    registerRuntimeCompiler: registerRuntimeCompiler,
    provide: provide,
    inject: inject,
    createRenderer: createRenderer,
    toDisplayString: toDisplayString,
    get ReactiveFlag () { return exports.ReactiveFlag; },
    reactive: reactive,
    readonly: readonly,
    shallowReadonly: shallowReadonly,
    isReactive: isReactive,
    isReadonly: isReadonly,
    isProxy: isProxy,
    ref: ref,
    isRef: isRef,
    unRef: unRef,
    proxyRefs: proxyRefs,
    ReactiveEffect: ReactiveEffect,
    track: track,
    trackEffects: trackEffects,
    trigger: trigger,
    triggerEffects: triggerEffects,
    effect: effect,
    stop: stop,
    computed: computed
});

function compileToFunction(template) {
    const { code } = baseCompile(template);
    const render = new Function("Vue", code)(runtimeDom);
    return render;
}
registerRuntimeCompiler(compileToFunction);

exports.ReactiveEffect = ReactiveEffect;
exports.computed = computed;
exports.createApp = createApp;
exports.createElementVNode = createVNode;
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
exports.registerRuntimeCompiler = registerRuntimeCompiler;
exports.renderSlots = renderSlots;
exports.shallowReadonly = shallowReadonly;
exports.stop = stop;
exports.toDisplayString = toDisplayString;
exports.track = track;
exports.trackEffects = trackEffects;
exports.trigger = trigger;
exports.triggerEffects = triggerEffects;
exports.unRef = unRef;
