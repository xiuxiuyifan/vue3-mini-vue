import { NodeTypes } from "../ast";

/**
 * 转换 表达式的 ast
 * @param node
 */
export function transformExpression(node) {
  if (node.type === NodeTypes.INTERPOLATION) {
    node.content = processExpression(node.content);
  }
}

// 转换 ast 的 content 属性
function processExpression(node: any) {
  node.content = `_ctx.${node.content}`;
  return node;
}
