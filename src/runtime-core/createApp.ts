import { createVNode } from "./vnode";

export function createAppAPI(render) {
  return function createApp(rootComponent) {
    return {
      mount(rootContainer) {
        // 根据传进来的  参数 把组件转换成 虚拟节点
        const vnode = createVNode(rootComponent);

        render(vnode, rootContainer);
      },
    };
  };
}
