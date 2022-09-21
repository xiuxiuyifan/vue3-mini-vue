export function initSlots(instance, children) {
  // 把 slots 放到对象里面
  const slots = {};
  for (const key in children) {
    const value = children[key];
    slots[key] = Array.isArray(value) ? value : [value];
  }
  instance.slots = slots;
}
