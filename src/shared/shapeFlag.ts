export const enum ShapeFlags {
  ELEMENT = 1, // 元素
  STATEFUL_COMPONENT = 1 << 1, // 有状态组件
  TEXT_CHILDREN = 1 << 2, // vnode 的孩子是 文本
  ARRAY_CHILDREN = 1 << 3, // vnode 的孩子是数组
  SLOT_CHILDREN = 1 << 4, // slot children
}
