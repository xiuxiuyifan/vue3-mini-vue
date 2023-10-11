import { ShapeFlags } from "../shared/shapeFlag";

export const Fragment = Symbol("Fragment");
export const Text = Symbol("Text");

export { createVNode as createElementVNode };

export function createVNode(type, props?, children?) {
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
    vnode.shapeFlag |= ShapeFlags.TEXT_CHILDREN;
  } else if (Array.isArray(vnode.children)) {
    vnode.shapeFlag |= ShapeFlags.ARRAY_CHILDREN;
  }

  // 如果是有状态组件 并且 children 是 object 那么就是 slot children
  if (vnode.shapeFlag & ShapeFlags.STATEFUL_COMPONENT) {
    if (typeof children === "object") {
      vnode.shapeFlag |= ShapeFlags.SLOT_CHILDREN;
    }
  }
  return vnode;
}

/**
 * 创建文本的虚拟节点
 * @param text
 * @returns
 */
export function createTextVNode(text: string) {
  return createVNode(Text, {}, text);
}

// 如果 type 是 string 的话就表示 vnode 是一个元素  否则就是 有状态组件
function getShapeFlag(type) {
  return typeof type === "string"
    ? ShapeFlags.ELEMENT
    : ShapeFlags.STATEFUL_COMPONENT;
}
