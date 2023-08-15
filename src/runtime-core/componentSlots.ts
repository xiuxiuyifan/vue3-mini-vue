import { ShapeFlags } from "../shared/shapeFlag";

export function initSlots(instance, children) {
  // 把 slots 放到对象里面
  const slots = {};
  const { vnode } = instance;
  // 如果 vnode 的形状里面包含 slot_children，那么
  if (vnode.shapeFlag & ShapeFlags.SLOT_CHILDREN) {
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
