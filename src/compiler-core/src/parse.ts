import { NodeTypes } from "./ast";

const enum TagType {
  Start,
  End,
}

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
  const s = context.source;
  // 解析插值类型
  if (s.startsWith("{{")) {
    // 将 context 交给专门处理插值的函数进行处理
    node = parseInterpolation(context);
  }
  // 元素类型  字符串的开头是 < 开始的
  else if (s[0] === "<") {
    // 再看第一个元素是不是 a-z
    if (/[a-z]/i.test(s[1])) {
      node = parseElement(context);
    }
  }

  if (!node) {
    node = parseText(context);
  }
  nodes.push(node);
  return nodes;
}

function parseText(context: any) {
  // 获取 content 内容
  const content = parseTextData(context, context.source.length);

  return {
    type: NodeTypes.TEXT,
    content,
  };
}

// 获取 一定长度的字符串，并且向前推进
function parseTextData(context: any, length) {
  // 截取字符串的一部分
  const content = context.source.slice(0, length);

  // 向前推进
  advanceBy(context, length);
  return content;
}

// 解析 元素
function parseElement(context: any) {
  // 先处理元素的开始标签
  const element = parseTag(context, TagType.Start);
  // 在处理 元素的结束标签
  parseTag(context, TagType.End);

  return element;
}

function parseTag(context: any, type: TagType) {
  // <div></div>
  const match: any = /^<\/?([a-z]*)/i.exec(context.source);
  // 拿到 捕获组里面的内容
  const tag = match[1];
  // 删掉已经匹配过的 字符串元素 <div   结束标签也是同理，会进这个逻辑的
  advanceBy(context, match[0].length);
  // 再删掉 >
  advanceBy(context, 1);
  // 如果遇到了结束标签，则直接退出
  if (type === TagType.End) return;

  return {
    type: NodeTypes.ELEMENT,
    tag,
  };
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
  const rawContent = parseTextData(context, rawContentLength);
  // 去除两端的空格
  const content = rawContent.trim();
  // 删除掉 已经处理过的位置的元素
  advanceBy(context, closeDelimiter.length);

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
