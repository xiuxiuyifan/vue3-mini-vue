import { h } from "../../lib/vue3-mini-vue.esm.js";
import { Foo } from "./Foo.js";

window.self = null;
const App = {
  render() {
    window.self = this;
    // return h('div', {
    //   onClick() {
    //     console.log('click')
    //   },
    //   onMousedown() {
    //     console.log('mousedown')
    //   }
    // }, [
    //   h('div', {}, "hi" + this.msg),
    //   h(Foo, { count: 100 })
    // ])
    return h("div", {}, "hiihi");
  },

  setup() {
    return {
      msg: "hello world -",
    };
  },
};

export default App;
