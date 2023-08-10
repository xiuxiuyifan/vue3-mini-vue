import { reactive, effect } from "../../lib/vue3-mini-vue.esm.js";

let obj1 = reactive({ a: 100, b: 200 });

let obj2 = reactive({ c: 1 });

// a 属性在 四个 effect 中用了

effect(() => {
  console.log(obj1.a);
});

effect(() => {
  console.log(obj1.a);
});
