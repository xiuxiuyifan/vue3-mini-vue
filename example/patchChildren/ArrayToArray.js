import { h, ref } from "../../lib/vue3-mini-vue.esm.js";

const prevChildren = [h("div", {}, "A"), h("div", {}, "B"), h("div", {}, "C")];
const nextChildren = [h("div", {}, "D"), h("div", {}, "E"), h("div", {}, "F")];

export default {
  name: "ArrayToArray",
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
