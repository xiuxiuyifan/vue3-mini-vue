import { h, ref } from "../../lib/vue3-mini-vue.esm.js";
import ArrayToArray from "./ArrayToArray.js";
import ArrayToText from "./ArrayToText.js";
import TextToArray from "./TextToArray.js";
import TextToText from "./TextToText.js";

export const App = {
  name: "App",
  render() {
    // 先考虑好几种情况
    // 老节点   新节点
    // 文本     文本  更新文本
    // 文本     数组  删除老节点，挂载新节点
    // 数组     文本  清空老儿子，设置新文本
    // 数组     数组  diff 算法

    // return h("div", {}, [h("p", {}, "App 组件"), h(TextToText)]);
    // return h("div", {}, [h("p", {}, "App 组件"), h(TextToArray)]);
    // return h("div", {}, [h("p", {}, "App 组件"), h(ArrayToText)]);
    return h("div", {}, [h("p", {}, "App 组件"), h(ArrayToArray)]);
  },

  setup() {},
};
