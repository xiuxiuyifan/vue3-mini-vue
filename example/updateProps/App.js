import { h, ref } from "../../lib/vue3-mini-vue.esm.js";

export const App = {
  render() {
    return h(
      "div",
      {
        id: "App",
        ...this.props,
      },
      [
        h(
          "button",
          { onClick: this.onChangePropsDemo1 },
          "changeProps - 值改变了 修改"
        ),

        h(
          "button",
          { onClick: this.onChangePropsDemo2 },
          "changeProps - 值 变成 undefined了 删除"
        ),

        h(
          "button",
          { onClick: this.onChangePropsDemo3 },
          "changeProps - key 在新的里面没有了 删除"
        ),
      ]
    );
  },

  setup() {
    const props = ref({
      foo: "foo",
      bar: "bar",
    });

    // 修改
    const onChangePropsDemo1 = () => {
      props.value.foo = "new-foo";
    };
    // 自身删除
    const onChangePropsDemo2 = () => {
      props.value.foo = undefined;
    };
    // 完全替换 props
    const onChangePropsDemo3 = () => {
      props.value = {
        foo: "foo",
      };
    };
    return {
      props,
      onChangePropsDemo1,
      onChangePropsDemo2,
      onChangePropsDemo3,
    };
  },
};
