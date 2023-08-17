import { h, ref } from "../../lib/vue3-mini-vue.esm.js";

export const App = {
  render() {
    return h("div", {}, [
      h("div", {}, "count " + this.count),
      h(
        "button",
        {
          onClick: this.onClick,
        },
        "click"
      ),
    ]);
  },

  setup() {
    const count = ref(0);

    const onClick = () => {
      count.value++;
    };
    return {
      count,
      onClick,
    };
  },
};
