import { h, ref } from "../../lib/vue3-mini-vue.esm.js";

const prevChildren = [h("div", {}, "1"), h("div", {}, "2"), h("div", {}, "3")];
const nextChildren = "oldChild";

export default {
  name: "ArrayToText",
  setup() {
    const isChange = ref(false);
    window.isChange = isChange;

    return {
      isChange,
    };
  },
  render() {
    return this.isChange
      ? h("div", {}, nextChildren)
      : h("div", {}, prevChildren);
  },
};
