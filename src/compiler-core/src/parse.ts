import { NodeTypes } from "./ast";

/**
 *
 * @param content 接受 template 字符串
 */
export function baseParse(content: string) {
  const context = createParserContext(content);

  return createRoot(parseChildren(context));
}

function parseChildren(context) {
  const nodes: any = [];

  let node;
  // 解析插值类型
  if (context.source.startsWith("{{")) {
    // 将 context 交给专门处理插值的函数进行处理
    node = parseInterpolation(context);
  }
  nodes.push(node);
  return nodes;
}

/**
 * 解析 插值类型
 * @param context 解析上下文对象
 * @returns
 */
function parseInterpolation(context) {
  // {{message}}

  const openDelimiter = "{{";
  const closeDelimiter = "}}";

  // 计算出结束 插值标签的索引位置
  const closeIndex = context.source.indexOf(
    closeDelimiter,
    openDelimiter.length
  );

  // 从插值标签开始向后推进两个
  advanceBy(context, openDelimiter.length);
  // 拿到插值内容的长度
  const rawContentLength = closeIndex - openDelimiter.length;
  // 截取出 原始的差值内容
  const rawContent = context.source.slice(0, rawContentLength);
  // 去除两端的空格
  const content = rawContent.trim();
  // 删除掉 已经处理过的位置的元素
  advanceBy(context, rawContentLength + closeDelimiter.length);

  // 返回出插值类型节点的 node
  return {
    type: NodeTypes.INTERPOLATION,
    content: {
      type: NodeTypes.SIMPLE_EXPRESSION,
      content: content,
    },
  };
}

/**
 *
 * @param context 正在处理的上下文对象
 * @param length 要截取的字符串长度
 */
function advanceBy(context: any, length: number) {
  context.source = context.source.slice(length);
}

function createRoot(children) {
  return {
    children,
  };
}

function createParserContext(content: string): any {
  return {
    source: content,
  };
}
