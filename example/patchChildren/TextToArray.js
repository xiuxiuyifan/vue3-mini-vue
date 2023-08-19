import { h, ref } from "../../lib/vue3-mini-vue.esm.js";

const prevChildren = "oldChild";
const nextChildren = [h("div", {}, "1"), h("div", {}, "2"), h("div", {}, "3")];

export default {
  name: "TextToArray",
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
