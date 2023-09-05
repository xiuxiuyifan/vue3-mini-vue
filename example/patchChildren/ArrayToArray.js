import { h, ref } from "../../lib/vue3-mini-vue.esm.js";

// 1、前前对比
// (a b) c
// (a b) d e    新的前面的都相等 有新增和删除

// const prevChildren = [
//   h("div", { key: "A" }, "A"),
//   h("div", { key: "B" }, "B"),
//   h("div", { key: "C" }, "C"),
// ];
// const nextChildren = [
//   h("div", { key: "A" }, "A"),
//   h("div", { key: "B" }, "B"),
//   h("div", { key: "D" }, "D"),
//   h("div", { key: "E" }, "E"),
// ];

// 2、后后对比
// a (b c)
// d e (b c)
// const prevChildren = [
//   h("div", { key: "A" }, "A"),
//   h("div", { key: "B" }, "B"),
//   h("div", { key: "C" }, "C"),
// ];
// const nextChildren = [
//   h("div", { key: "D" }, "D"),
//   h("div", { key: "E" }, "E"),
//   h("div", { key: "B" }, "B"),
//   h("div", { key: "C" }, "C"),
// ];

// 3、新的比老的长
// (a b)
// (a b) c
// 从前面开始对比，新插入的元素在后面
// i= 2  e1 = 1 e2 = 2
// 如果 i 大于 老节点的长度，则说明新的比老的长需要新增元素
// const prevChildren = [h("div", { key: "A" }, "A"), h("div", { key: "B" }, "B")];
// const nextChildren = [
//   h("div", { key: "A" }, "A"),
//   h("div", { key: "B" }, "B"),
//   h("div", { key: "C" }, "C"),
// ];

// 从后面开始对比，新插入的元素在前面
//   (a b)
// c (a b)
// const prevChildren = [h("div", { key: "A" }, "A"), h("div", { key: "B" }, "B")];
// const nextChildren = [
//   h("div", { key: "C" }, "C"),
//   h("div", { key: "A" }, "A"),
//   h("div", { key: "B" }, "B"),
// ];
// 4、老的比新的长
// 从前面开始对比，后面多了
// (a b) c
// (a b)

// const prevChildren = [
//   h("div", { key: "A" }, "A"),
//   h("div", { key: "B" }, "B"),
//   h("div", { key: "C" }, "C"),
// ];
// const nextChildren = [h("div", { key: "A" }, "A"), h("div", { key: "B" }, "B")];
// 后后面开始对比，前面多了
// a (b c)
//   (b c)
// const prevChildren = [
//   h("div", { key: "A" }, "A"),
//   h("div", { key: "B" }, "B"),
//   h("div", { key: "C" }, "C"),
// ];
// const nextChildren = [h("div", { key: "B" }, "B"), h("div", { key: "C" }, "C")];

// 中间部分对比

// 删除老的，（老的里面存在，新的里面不存在）

// a, b, (c, d), f, g
// a, b, (e, c), f, g
// d 节点在新的里面没有，需要删除掉
// c 节点的 props 发生了变化，需要更新
// const prevChildren = [
//   h("div", { key: "A" }, "A"),
//   h("div", { key: "B" }, "B"),
//   h("div", { key: "C" }, "C"),
//   h("div", { key: "D" }, "D"),
//   h("div", { key: "F" }, "F"),
//   h("div", { key: "G" }, "G"),
// ];
// const nextChildren = [
//   h("div", { key: "A" }, "A"),
//   h("div", { key: "B" }, "B"),
//   h("div", { key: "E" }, "E"), // 新增的先不管
//   h("div", { key: "C" }, "C"),
//   h("div", { key: "F" }, "F"),
//   h("div", { key: "G" }, "G"),
// ];

// 中间部分， 老的比新的多，那么多出来的直接就可以删除掉 ，（已经patch过的元素大于等于中间新元素的个数）优化删除逻辑
// const prevChildren = [
//   h("div", { key: "A" }, "A"),
//   h("div", { key: "B" }, "B"),
//   h("div", { key: "C", id: "c-prev" }, "C"),
//   h("div", { key: "E" }, "E"),
//   h("div", { key: "D" }, "D"),
//   h("div", { key: "F" }, "F"),
//   h("div", { key: "G" }, "G"),
// ];
// const nextChildren = [
//   h("div", { key: "A" }, "A"),
//   h("div", { key: "B" }, "B"),
//   h("div", { key: "E" }, "E"), // 新增的先不管
//   h("div", { key: "C", id: "c-next" }, "C"),
//   h("div", { key: "F" }, "F"),
//   h("div", { key: "G" }, "G"),
// ];

// 2 移动（节点存在于新的和老的里面，但是位置变了）
// const prevChildren = [
//   h("div", { key: "A" }, "A"),
//   h("div", { key: "B" }, "B"),
//   h("div", { key: "C" }, "C"),
//   h("div", { key: "D" }, "D"),
//   h("div", { key: "E" }, "E"),
//   h("div", { key: "F" }, "F"),
//   h("div", { key: "G" }, "G"),
// ];
// const nextChildren = [
//   h("div", { key: "A" }, "A"),
//   h("div", { key: "B" }, "B"),
//   h("div", { key: "E" }, "E"),
//   h("div", { key: "C" }, "C"),
//   h("div", { key: "D" }, "D"),
//   h("div", { key: "F" }, "F"),
//   h("div", { key: "G" }, "G"),
// ];

// 创建新的节点
// a,b,(c,e),f,g
// a,b,(e,c,d),f,g
// d 节点在老的节点中不存在，新的里面存在，所以需要创建。
// const prevChildren = [
//   h("div", { key: "A" }, "A"),
//   h("div", { key: "B" }, "B"),
//   h("div", { key: "C" }, "C"),
//   h("div", { key: "E" }, "E"),
//   h("div", { key: "F" }, "F"),
//   h("div", { key: "G" }, "G"),
// ];
// const nextChildren = [
//   h("div", { key: "A" }, "A"),
//   h("div", { key: "B" }, "B"),
//   h("div", { key: "E" }, "E"),
//   h("div", { key: "C" }, "C"),
//   h("div", { key: "D" }, "D"),
//   h("div", { key: "F" }, "F"),
//   h("div", { key: "G" }, "G"),
// ];

// 综合例子
// a,b,(c,d,e,z),f,g
// a,b,(d,c,y,e),f,g
// 新元素在老元素中索引的位置 [4,3,0,5]   [newIndex - s2] =  i(新节点在老节点中的位置)
// ce 最长递增序列
// y 新增
// d 移动

const prevChildren = [
  h("p", { key: "A" }, "A"),
  h("p", { key: "B" }, "B"),

  h("p", { key: "C" }, "C"),
  h("p", { key: "D" }, "D"),
  h("p", { key: "E" }, "E"),
  h("p", { key: "Z" }, "Z"),

  h("p", { key: "F" }, "F"),
  h("p", { key: "G" }, "G"),
];

const nextChildren = [
  h("p", { key: "A" }, "A"),
  h("p", { key: "B" }, "B"),

  h("p", { key: "D" }, "D"),
  h("p", { key: "C" }, "C"),
  h("p", { key: "Y" }, "Y"),
  h("p", { key: "E" }, "E"),

  h("p", { key: "F" }, "F"),
  h("p", { key: "G" }, "G"),
];
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
