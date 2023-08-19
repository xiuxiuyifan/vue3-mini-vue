import { effect } from "src/reactivity";
import { ShapeFlags } from "../shared/shapeFlag";
import { createComponentInstance, setupComponent } from "./component";
import { createAppAPI } from "./createApp";
import { Fragment, Text } from "./vnode";

export function createRenderer(options) {
  const {
    createElement: hostCreateElement,
    patchProp: hostPatchProp,
    insert: hostInsert,
    setElementText: hostSetElementText,
    remove: hostRemove,
  } = options;

  function render(vnode, container) {
    // patch 根组件的时候 父组件 为 null
    patch(null, vnode, container, null);
  }

  function patch(n1, n2, container, parentComponent) {
    // 需要判断当前的 vnode 是不是 element
    // 如果是一个 element 的话就应该处理 element
    // 如何区分是 组件类型还是 element 类型？？
    const { type, shapeFlag } = n2;
    switch (type) {
      case Fragment:
        processFragment(n1, n2, container, parentComponent);
        break;
      case Text:
        processText(n1, n2, container);
        break;
      default:
        if (shapeFlag & ShapeFlags.ELEMENT) {
          processElement(n1, n2, container, parentComponent);
        } else if (shapeFlag & ShapeFlags.STATEFUL_COMPONENT) {
          // 处理组件
          processComponent(n1, n2, container, parentComponent);
        }
        break;
    }
  }

  /**
   * 其实就是只把 children 渲染出来就行
   * @param n2
   * @param container
   */
  function processFragment(n1, n2, container, parentComponent) {
    mountChildren(n2.children, container, parentComponent);
  }

  /**
   * 根据文本虚拟节点创建真实的文本节点
   * @param n2
   * @param container
   */
  function processText(n1, n2, container) {
    // 取出文本内容
    const { children } = n2;
    const textNode = (n2.el = document.createTextNode(children));
    container.append(textNode);
  }
  function processComponent(n1, n2: any, container: any, parentComponent) {
    mountComponent(n2, container, parentComponent);
  }

  /**
   *
   * @param initialVNode 初始化组件的 vnode
   * @param container
   */
  function mountComponent(initialVNode: any, container: any, parentComponent) {
    const instance = createComponentInstance(initialVNode, parentComponent);

    setupComponent(instance);
    setupRenderEffect(instance, initialVNode, container);
  }

  function setupRenderEffect(instance, initialVNode, container) {
    effect(() => {
      if (!instance.isMounted) {
        console.log("初始化");
        const { proxy } = instance;
        // 拿到组件内部  render 函数返回的虚拟节点
        const subTree = (instance.subTree = instance.render.call(proxy));

        // vnode -> patch
        // vnode -> element -> mountElement
        patch(null, subTree, container, instance);
        // 把根节点的 el 赋值给组件的虚拟节点
        initialVNode.el = subTree.el;
        // 标记组件已经挂载完毕
        instance.isMounted = true;
      } else {
        console.log("更新");
        const { proxy } = instance;
        // 最新的 subTree
        const subTree = instance.render.call(proxy);
        // 获取老的 subTree
        const prevSubTree = instance.subTree;
        // 更新老的 subTree
        instance.subTree = subTree;
        console.log("prevSubTree", prevSubTree);
        console.log("subTree", subTree);
        patch(prevSubTree, subTree, container, instance);
      }
    });
  }

  // 处理元素
  function processElement(n1, n2: any, container: any, parentComponent) {
    if (!n1) {
      mountElement(n2, container, parentComponent);
    } else {
      patchElement(n1, n2, container, parentComponent);
    }
  }

  // 挂载元素
  function mountElement(vnode: any, container: any, parentComponent) {
    const el = (vnode.el = hostCreateElement(vnode.type));

    // vnode.children 可能是 string 也可能是数组
    const { children, shapeFlag } = vnode;
    if (shapeFlag & ShapeFlags.TEXT_CHILDREN) {
      el.textContent = children;
    } else if (shapeFlag & ShapeFlags.ARRAY_CHILDREN) {
      mountChildren(vnode.children, el, parentComponent);
    }

    // props
    const { props } = vnode;
    for (let key in props) {
      let val = props[key];
      hostPatchProp(el, key, null, val);
    }
    hostInsert(el, container);
  }
  /**
   * 对比新老元素 vnode
   * @param n1
   * @param n2
   * @param container
   */
  function patchElement(n1, n2, container, parentComponent) {
    console.log("patchElement");
    console.log("n1", n1);
    console.log("n2", n2);

    let oldProps = n1.props || {};
    let newProps = n2.props || {};

    // 复用老元素 在同一个 DOM 上面打补丁
    let el = (n2.el = n1.el);
    // 对比孩子
    patchChildren(n1, n2, el, parentComponent);
    // 在对比元素的时候对比 属性
    patchProps(el, oldProps, newProps);
  }

  function patchChildren(n1, n2, el, parentComponent) {
    // 先拿到新节点的 vnode 和 shapeFlag
    const prevShapeFlag = n1.shapeFlag;
    const c1 = n1.children;
    const { shapeFlag } = n2;
    const c2 = n2.children;
    // 新节点是 text
    if (shapeFlag & ShapeFlags.TEXT_CHILDREN) {
      // 老节点就只能有两种情况 text 或者 array
      // 老节点是数组
      if (prevShapeFlag & ShapeFlags.ARRAY_CHILDREN) {
        // 卸载老儿子，并更新文本
        unmountChildren(n1.children);
      }
      // 老节点是文本
      if (c1 !== c2) {
        // 如果不行等则直接更新
        hostSetElementText(el, c2);
      }
    }
    // 新节点是数组
    else {
      // 老节点是 text
      if (prevShapeFlag & ShapeFlags.TEXT_CHILDREN) {
        // 卸载老文本，挂载新节点
        hostSetElementText(el, "");
        // 挂载新儿子节点
        mountChildren(c2, el, parentComponent);
      } else {
        console.log("diff 算法");
      }
    }
  }

  /**
   * 删除一组儿子
   * @param children
   */
  function unmountChildren(children) {
    for (let i = 0; i < children.length; i++) {
      const el = children[i].el;
      hostRemove(el);
    }
  }

  function patchProps(el, oldProps, newProps) {
    // 遍历新的属性
    for (let key in newProps) {
      const prevProp = oldProps[key];
      const nextProp = newProps[key];
      // 如果两者不相等就更新 新增或者修改
      if (prevProp !== nextProp) {
        hostPatchProp(el, key, prevProp, nextProp);
      }
    }
    // 遍历老的节点
    for (let key in oldProps) {
      const prevProp = oldProps[key];
      if (!(key in newProps)) {
        // 新的中有，老的中没有则执行删除操作。
        hostPatchProp(el, key, prevProp, null);
      }
    }
  }
  // 挂载孩子节点
  function mountChildren(children: any, container: any, parentComponent) {
    // 如果孩子是数组就，进行递归的调用，往刚才创建的 根节点下面添加新的元素
    children.forEach((v) => {
      patch(null, v, container, parentComponent);
    });
  }
  return {
    createApp: createAppAPI(render),
  };
}
