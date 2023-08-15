import { getCurrentInstance, h } from "../../lib/vue3-mini-vue.esm.js";

export const Foo = {
  name: "Foo",
  render() {
    return h("Foo", {}, "Foo");
  },

  setup() {
    const ctx = getCurrentInstance();
    console.log("Foo", ctx);
    return {};
  },
};
