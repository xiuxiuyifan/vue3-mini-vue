import { ShapeFlags } from "../shared/shapeFlag";
import { createComponentInstance, setupComponent } from "./component";

export function render(vnode, container) {
  patch(vnode, container);
}

function patch(vnode, container) {
  // 需要判断当前的 vnode 是不是 element
  // 如果是一个 element 的话就应该处理 element
  // 如何区分是 组件类型还是 element 类型？？
  const { shapeFlag } = vnode;
  if (shapeFlag & ShapeFlags.ELEMENT) {
    processElement(vnode, container);
  } else if (shapeFlag & ShapeFlags.STATEFUL_COMPONENT) {
    // 处理组件
    processComponent(vnode, container);
  }
}

function processComponent(vnode: any, container: any) {
  mountComponent(vnode, container);
}

/**
 *
 * @param initialVNode 初始化组件的 vnode
 * @param container
 */
function mountComponent(initialVNode: any, container: any) {
  const instance = createComponentInstance(initialVNode);

  setupComponent(instance);
  setupRenderEffect(instance, initialVNode, container);
}

function setupRenderEffect(instance, initialVNode, container) {
  const { proxy } = instance;
  // 拿到组件内部  render 函数返回的虚拟节点
  const subTree = instance.render.call(proxy);

  // vnode -> patch
  // vnode -> element -> mountElement
  patch(subTree, container);
  // 把根节点的 el 赋值给组件的虚拟节点
  initialVNode.el = subTree.el;
}

// 处理元素
function processElement(vnode: any, container: any) {
  mountElement(vnode, container);
}

// 挂载元素
function mountElement(vnode: any, container: any) {
  const el = (vnode.el = document.createElement(vnode.type));

  // vnode.children 可能是 string 也可能是数组
  const { children, shapeFlag } = vnode;
  if (shapeFlag & ShapeFlags.TEXT_CHILDREN) {
    el.textContent = children;
  } else if (shapeFlag & ShapeFlags.ARRAY_CHILDREN) {
    mountChildren(vnode, el);
  }

  // props
  const { props } = vnode;
  for (let key in props) {
    let val = props[key];
    el.setAttribute(key, val);
  }
  container.append(el);
}

// 挂载孩子节点
function mountChildren(vnode: any, container: any) {
  // 如果孩子是数组就，进行递归的调用，往刚才创建的 根节点下面添加新的元素
  vnode.children.forEach((v) => {
    patch(v, container);
  });
}
