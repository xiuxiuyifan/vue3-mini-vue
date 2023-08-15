import { h, renderSlots } from "../../lib/vue3-mini-vue.esm.js";

export const Foo = {
  setup() {
    return {};
  },
  render() {
    const age = 18;
    const foo = h("p", {}, "foo");
    return h("div", {}, [
      renderSlots(this.$slots, "header", { age }),
      foo,
      renderSlots(this.$slots, "footer"),
    ]);
  },
};
