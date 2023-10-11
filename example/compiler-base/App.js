import { h, ref } from "../../lib/vue3-mini-vue.esm.js";

const App = {
  name: "App",
  template: `<div>hi,{{count}}</div>`,
  setup(props) {
    const count = (window.count = ref(1));
    return {
      count,
    };
  },
};

export default App;
