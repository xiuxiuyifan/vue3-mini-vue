import { getCurrentInstance, h } from "../../lib/vue3-mini-vue.esm.js";
import { Foo } from "./Foo.js";

export const App = {
  name: "App",
  render() {
    return h("div", {}, [h("div", {}, "App"), h(Foo, {}, {})]);
  },

  setup() {
    const ctx = getCurrentInstance();
    console.log("App", ctx);
    return {};
  },
};
