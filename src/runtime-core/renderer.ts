import { effect } from "src/reactivity";
import { ShapeFlags } from "../shared/shapeFlag";
import { createComponentInstance, setupComponent } from "./component";
import { createAppAPI } from "./createApp";
import { Fragment, Text } from "./vnode";
import { shouldUpdateComponent } from "./componentUpdateUtils";
import { queueJobs } from "./scheduler";

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
    patch(null, vnode, container, null, null);
  }

  function patch(n1, n2, container, parentComponent, anchor) {
    // 需要判断当前的 vnode 是不是 element
    // 如果是一个 element 的话就应该处理 element
    // 如何区分是 组件类型还是 element 类型？？
    const { type, shapeFlag } = n2;
    switch (type) {
      case Fragment:
        processFragment(n1, n2, container, parentComponent, anchor);
        break;
      case Text:
        processText(n1, n2, container);
        break;
      default:
        if (shapeFlag & ShapeFlags.ELEMENT) {
          processElement(n1, n2, container, parentComponent, anchor);
        } else if (shapeFlag & ShapeFlags.STATEFUL_COMPONENT) {
          // 处理组件， 组件有一个开箱的过程。
          processComponent(n1, n2, container, parentComponent, anchor);
        }
        break;
    }
  }

  /**
   * 其实就是只把 children 渲染出来就行
   * @param n2
   * @param container
   */
  function processFragment(n1, n2, container, parentComponent, anchor) {
    mountChildren(n2.children, container, parentComponent, anchor);
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
  // 处理组件也要分 挂载和更新
  function processComponent(
    n1,
    n2: any,
    container: any,
    parentComponent,
    anchor
  ) {
    if (!n1) {
      mountComponent(n2, container, parentComponent, anchor);
    } else {
      updateComponent(n1, n2);
    }
  }

  function updateComponent(n1, n2) {
    // 把老实例给新虚拟节点的实例
    const instance = (n2.component = n1.component);
    // 判断组件是否需要更新
    if (shouldUpdateComponent(n1, n2)) {
      instance.next = n2;
      instance.update();
    } else {
      // 组件不需要更新，则不需要执行 update 函数
      n2.el = n1.el;
      instance.vnode = n2;
    }
  }

  /**
   *
   * @param initialVNode 初始化组件的 vnode
   * @param container
   */
  function mountComponent(
    initialVNode: any,
    container: any,
    parentComponent,
    anchor
  ) {
    // 在虚拟节点上保存 组件实例信息
    const instance = (initialVNode.component = createComponentInstance(
      initialVNode,
      parentComponent
    ));

    setupComponent(instance);
    setupRenderEffect(instance, initialVNode, container, anchor);
  }

  function setupRenderEffect(instance, initialVNode, container, anchor) {
    // 将副作用函保存到 组件实例身上
    instance.update = effect(
      () => {
        if (!instance.isMounted) {
          console.log("初始化");
          const { proxy } = instance;
          // 拿到组件内部  render 函数返回的虚拟节点
          const subTree = (instance.subTree = instance.render.call(
            proxy,
            proxy
          ));

          // vnode -> patch
          // vnode -> element -> mountElement
          patch(null, subTree, container, instance, anchor);
          // 把根节点的 el 赋值给组件的虚拟节点
          initialVNode.el = subTree.el;
          // 标记组件已经挂载完毕
          instance.isMounted = true;
        } else {
          console.log("更新");
          const { next, vnode } = instance;
          if (next) {
            next.el = vnode.el;
            // 在组件 重新渲染之前先 根据新的 虚拟节点更新组件的信息，然后渲染的时候拿到的就是最新的组件信息了
            updateComponentPreRender(instance, next);
          }
          const { proxy } = instance;
          // 最新的 subTree
          const subTree = instance.render.call(proxy, proxy);
          // 获取老的 subTree
          const prevSubTree = instance.subTree;
          // 更新老的 subTree
          instance.subTree = subTree;
          console.log("prevSubTree", prevSubTree);
          console.log("subTree", subTree);
          patch(prevSubTree, subTree, container, instance, anchor);
        }
      },
      // 在数据发生变化的时候，不在自动执行  effect 函数，而是执行调度函数
      {
        scheduler() {
          queueJobs(instance.update);
        },
      }
    );
  }

  // 处理元素
  function processElement(
    n1,
    n2: any,
    container: any,
    parentComponent,
    anchor
  ) {
    if (!n1) {
      mountElement(n2, container, parentComponent, anchor);
    } else {
      patchElement(n1, n2, container, parentComponent, anchor);
    }
  }

  // 挂载元素
  function mountElement(vnode: any, container: any, parentComponent, anchor) {
    const el = (vnode.el = hostCreateElement(vnode.type));

    // vnode.children 可能是 string 也可能是数组
    const { children, shapeFlag } = vnode;
    if (shapeFlag & ShapeFlags.TEXT_CHILDREN) {
      el.textContent = children;
    } else if (shapeFlag & ShapeFlags.ARRAY_CHILDREN) {
      mountChildren(vnode.children, el, parentComponent, anchor);
    }

    // props
    const { props } = vnode;
    for (let key in props) {
      let val = props[key];
      hostPatchProp(el, key, null, val);
    }
    hostInsert(el, container, anchor);
  }
  /**
   * 对比新老元素 vnode
   * @param n1
   * @param n2
   * @param container
   */
  function patchElement(n1, n2, container, parentComponent, anchor) {
    console.log("patchElement");
    console.log("n1", n1);
    console.log("n2", n2);

    let oldProps = n1.props || {};
    let newProps = n2.props || {};

    // 复用老元素 在同一个 DOM 上面打补丁
    let el = (n2.el = n1.el);
    // 对比孩子
    patchChildren(n1, n2, el, parentComponent, anchor);
    // 在对比元素的时候对比 属性
    patchProps(el, oldProps, newProps);
  }

  function patchChildren(n1, n2, el, parentComponent, anchor) {
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
        mountChildren(c2, el, parentComponent, anchor);
      } else {
        patchKeyedChildren(c1, c2, el, parentComponent, anchor);
      }
    }
  }

  /**
   *
   * @param c1 老子节点
   * @param c2 新子节点
   * @param container
   * @param parentComponent
   * @param parentAnchor
   */
  function patchKeyedChildren(c1, c2, container, parentComponent, anchor) {
    const l2 = c2.length;

    let i = 0;
    let e1 = c1.length - 1;
    let e2 = l2 - 1;

    function isSameVNodeType(n1, n2) {
      return n1.type === n2.type && n1.key === n2.key;
    }

    // 从左侧开始进行对比
    while (i <= e1 && i <= e2) {
      const n1 = c1[i];
      const n2 = c2[i];

      // 如果相等则 继续比较当前节点
      if (isSameVNodeType(n1, n2)) {
        patch(n1, n2, container, parentComponent, anchor);
      } else {
        // 如果遇到不相等的，则进行下一项比较
        break;
      }
      i++;
    }
    console.log(`前前对比结束`, i, e1, e2);
    while (i <= e1 && i <= e2) {
      const n1 = c1[e1];
      const n2 = c2[e2];

      if (isSameVNodeType(n1, n2)) {
        patch(n1, n2, container, parentComponent, anchor);
      } else {
        break;
      }
      e1--;
      e2--;
    }
    console.log(`后后对比结束`, i, e1, e2);
    if (i > e1) {
      // 新的比老的多
      // 这个区间代表了多出来的元素
      // 新的
      if (i <= e2) {
        // 新节点尾部位置 + 1
        const nextPos = e2 + 1;
        // 寻找参照点
        // 前面新增和后面新增的两种情况
        // 找到参考点一直传下去
        const anchor = nextPos < l2 ? c2[nextPos].el : null;
        while (i <= e2) {
          patch(null, c2[i], container, parentComponent, anchor);
          i++;
        }
      }
    } else if (i > e2) {
      // 老的比新的多
      // 要删除的区间就是 [i, e1] 之间的元素
      while (i <= e1) {
        hostRemove(c1[i].el);
        i++;
      }
    } else {
      console.log("中间对比");
      let s1 = i;
      let s2 = i;

      // 将要对比的中间差异元素的个数
      const toBePatched = e2 - s2 + 1;

      // 新老节点相同的，已经深度patch过的元素
      let patched = 0;

      // 用新元素的 key 和下标构建一个 Map 对象
      const keyToNewIndexMap = new Map();
      // 用一个 map 来收集 差异节点中新节点在老节点中的位置
      const newIndexToOldIndexMap = new Array(toBePatched); // 初始化长度等于新元素
      // 记录 元素是否移动位置
      let moved = false;
      let maxNewIndexSoFar = 0;
      // 先给每一个初始化为 0
      for (let i = 0; i < toBePatched; i++) {
        newIndexToOldIndexMap[i] = 0;
      }

      // 遍历新元素中间剩余的
      for (let i = s2; i <= e2; i++) {
        const nextChild = c2[i];
        keyToNewIndexMap.set(nextChild.key, i);
      }

      // 遍历老的元素，看老的元素是否在新的元素中出现。
      for (let i = s1; i <= e1; i++) {
        const prevChild = c1[i];

        if (patched >= toBePatched) {
          // 移除老的元素
          hostRemove(prevChild.el);
          continue;
        }

        let newIndex;
        // 如果老的 vnode 里面有 key，则去新节点构建的 map 中去查找
        // null 和 undefined
        if (prevChild.key != null) {
          newIndex = keyToNewIndexMap.get(prevChild.key);
        } else {
          // 如果没有可以，则进行双重循环对比 n²
          // 遍历新的节点
          for (let j = s2; j <= e2; j++) {
            if (isSameVNodeType(prevChild, e2[j])) {
              newIndex = j;
              break;
            }
          }
        }
        // 如果老节点在新节点中不存在，则将其移除掉
        if (newIndex === undefined) {
          hostRemove(prevChild.el);
        } else {
          // 老节点中存在，新节点中也存在
          // 如果 新节点一直大于迄今为止最大的索引，则说明没有元素位置发生了变化
          if (newIndex >= maxNewIndexSoFar) {
            // 更新当前最大的索引值
            maxNewIndexSoFar = newIndex;
          } else {
            // 如果一旦有小于最大的索引，则说明元素位置发生了变化
            moved = true;
          }
          newIndexToOldIndexMap[newIndex - s2] = i + 1; // i 代表 新节点在老节点中的位置。
          patch(prevChild, c2[newIndex], container, parentComponent, null);
          patched++;
        }
      }
      // 老元素对比完成之后，看看是否有要移动的元素，如果有，则需要用新元素在老元素中的位置求出，最大递增子序列
      const increasingNewIndexSequence = moved
        ? getSequence(newIndexToOldIndexMap)
        : [];
      // 取出最长递增子序列的最后一位
      let j = increasingNewIndexSequence.length - 1;

      // 倒序遍历中间的差异元素
      for (let i = toBePatched - 1; i >= 0; i--) {
        // 当前遍历元素在新节点中的位置索引
        const nextIndex = i + s2;
        const nextChild = c2[nextIndex];
        // 计算插入 的参考点。
        // 要插入元素位置就是在当前元素的下一个元素之前，
        const anchor = nextIndex + 1 < l2 ? c2[nextIndex + 1].el : null;
        if (newIndexToOldIndexMap[i] === 0) {
          // 表示新增元素
          patch(null, nextChild, container, parentComponent, anchor);
        } else if (moved) {
          // 从后往前 遍历到的元素不是最长递增子序列里面的元素
          if (j < 0 || i !== increasingNewIndexSequence[j]) {
            // 需要移动当前新的节点
            hostInsert(nextChild.el, container, anchor);
          } else {
            // 不需要移动元素
            j--;
          }
        }
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
  function mountChildren(
    children: any,
    container: any,
    parentComponent,
    anchor
  ) {
    // 如果孩子是数组就，进行递归的调用，往刚才创建的 根节点下面添加新的元素
    children.forEach((v) => {
      patch(null, v, container, parentComponent, anchor);
    });
  }
  return {
    createApp: createAppAPI(render),
  };
}

function updateComponentPreRender(instance, nextVNode) {
  instance.vnode = nextVNode;
  instance.next = null;

  instance.props = nextVNode.props;
}

function getSequence(arr) {
  const p = arr.slice();
  const result = [0];
  let i, j, u, v, c;
  const len = arr.length;
  for (i = 0; i < len; i++) {
    const arrI = arr[i];
    if (arrI !== 0) {
      j = result[result.length - 1];
      if (arr[j] < arrI) {
        p[i] = j;
        result.push(i);
        continue;
      }
      u = 0;
      v = result.length - 1;
      while (u < v) {
        c = (u + v) >> 1;
        if (arr[result[c]] < arrI) {
          u = c + 1;
        } else {
          v = c;
        }
      }
      if (arrI < arr[result[u]]) {
        if (u > 0) {
          p[i] = result[u - 1];
        }
        result[u] = i;
      }
    }
  }
  u = result.length;
  v = result[u - 1];
  while (u-- > 0) {
    result[u] = v;
    v = p[v];
  }
  return result;
}
