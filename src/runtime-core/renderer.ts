import { createComponentInstance, setupComponent } from "./component";

export function render(vnode, container) {
  patch(vnode, container);
}

function patch(vnode, container) {
  // 需要判断当前的 vnode 是不是 element
  // 如果是一个 element 的话就应该处理 element
  // 如何区分是 组件类型还是 element 类型？？
  if (typeof vnode.type === "string") {
    processElement(vnode, container);
  } else {
    // 处理组件
    processComponent(vnode, container);
  }
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
  const { proxy } = instance;
  // 拿到组件内部  render 函数返回的虚拟节点
  const subTree = instance.render.call(proxy);

  // vnode -> patch
  // vnode -> element -> mountElement
  patch(subTree, container);
}

// 处理元素
function processElement(vnode: any, container: any) {
  mountElement(vnode, container);
}

// 挂载元素
function mountElement(vnode: any, container: any) {
  const el = document.createElement(vnode.type);

  // vnode.children 可能是 string 也可能是数组
  const { children } = vnode;
  if (typeof children === "string") {
    el.textContent = children;
  } else if (Array.isArray(children)) {
    debugger;
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
