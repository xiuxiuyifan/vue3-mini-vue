import { h, inject, provide } from "../../lib/vue3-mini-vue.esm.js";

const Provider = {
  render() {
    return h("div", {}, [h("p", {}, "Provide"), h(ProviderTwo)]);
  },
  setup() {
    provide("foo", "fooVal");
    provide("bar", "barVal");
  },
};

const ProviderTwo = {
  render() {
    return h("div", {}, [
      h("p", {}, `ProvideTwo foo: ${this.foo}`),
      h(Consumer),
    ]);
  },
  setup() {
    provide("foo", "fooTwo");
    const foo = inject("foo");

    return {
      foo,
    };
  },
};

const Consumer = {
  render() {
    console.log(this);
    return h(
      "div",
      {},
      `Consumer 组件 Foo: ${this.foo}  Bar: ${this.bar} Baz: ${this.baz} `
    );
  },
  setup() {
    const foo = inject("foo");
    const bar = inject("bar");
    const baz = inject("baz", "bazValue");
    return {
      foo,
      bar,
      baz,
    };
  },
};

const App = {
  render() {
    return h("div", {}, [h(Provider)]);
  },

  setup() {
    return {
      msg: "hello world -",
    };
  },
};

export default App;
