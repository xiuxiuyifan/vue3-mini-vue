import { NodeTypes } from "./ast";
import { TO_DISPLAY_STRING } from "./runtimeHelpers";

/**
 *
 * @param root 根节点
 * @param options 传进来的配置参数
 */
export function transform(root, options = {}) {
  // 创建一个遍历上下文对象

  const context = createTransformContext(root, options);
  traverseNode(root, context);
  // 返回出用来 生成代码的 ast
  createRootCodegen(root);

  root.helpers = [...context.helpers.keys()];
}

function createRootCodegen(root: any) {
  const child = root.children[0];
  if (child.type === NodeTypes.ELEMENT) {
    root.codegenNode = child.codegenNode;
  } else {
    root.codegenNode = root.children[0];
  }
}

// 创建遍历上下文对象
function createTransformContext(root: any, options: any) {
  const context = {
    root,
    nodeTransforms: options.nodeTransforms || [],
    helpers: new Map(),
    helper(key) {
      context.helpers.set(key, 1);
    },
  };

  return context;
}

// 深度优先遍历  ast 树
function traverseNode(node, context) {
  // 先遍历根节点，然后遍历儿子
  // 取出 用户传递的 options 里面的参数
  const nodeTransforms = context.nodeTransforms;
  const exitFns: any = [];

  for (let i = 0; i < nodeTransforms.length; i++) {
    // 调用用户的函数 ， 把 node 交给用户进行处理
    const transform = nodeTransforms[i];
    const onExit = transform(node, context);
    if (onExit) {
      exitFns.push(onExit);
    }
  }

  switch (node.type) {
    case NodeTypes.INTERPOLATION:
      context.helper(TO_DISPLAY_STRING);
      break;
    case NodeTypes.ROOT:
    case NodeTypes.ELEMENT:
      traverseChildren(node, context);
      break;
    default:
      break;
  }

  let i = exitFns.length;
  while (i--) {
    exitFns[i]();
  }
}

// 遍历孩子
function traverseChildren(node: any, context: any) {
  const children = node.children;
  if (children) {
    for (let i = 0; i < children.length; i++) {
      const childNode = children[i];
      // 继续递归遍历 深度优先遍历
      traverseNode(childNode, context);
    }
  }
}
