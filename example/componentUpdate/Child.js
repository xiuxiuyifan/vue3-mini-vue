import { h } from "../../lib/vue3-mini-vue.esm.js";

export const Child = {
  setup(props, { emit }) {},
  render(proxy) {
    return h("div", {}, [
      h("div", {}, "child - props - msg: " + this.$props.msg),
      // h("div", {}, "child - props - msg: " + "999"),
    ]);
  },
};
