import { createComponentInstance, setupComponent } from "./component";

export function render(vnode, container) {
  patch(vnode, container);
}

function patch(vnode, container) {
  // 需要判断当前的 vnode 是不是 element
  // 如果是一个 element 的话就应该处理 element
  // 如何区分是 组件类型还是 element 类型？？
  // 处理组件
  processComponent(vnode, container);
}

function processComponent(vnode: any, container: any) {
  mountComponent(vnode, container);
}

function mountComponent(vnode: any, container: any) {
  const instance = createComponentInstance(vnode);

  setupComponent(instance);
  setupRenderEffect(instance, container);
}

function setupRenderEffect(instance, container) {
  // 拿到组件内部  render 函数返回的虚拟节点
  const subTree = instance.render();

  // vnode -> patch
  // vnode -> element -> mountElement
  patch(subTree, container);
}
