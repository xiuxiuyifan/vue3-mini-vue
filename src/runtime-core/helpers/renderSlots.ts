import { createVnode } from "../vnode";

export function renderSlots(slots, name) {
  console.log(slots);
  const slot = slots[name];
  if (slot) {
    return createVnode("div", {}, slot);
  }
}
