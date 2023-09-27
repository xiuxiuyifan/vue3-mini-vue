import { NodeTypes } from "./ast";
import { TO_DISPLAY_STRING, helperMapName } from "./runtimeHelpers";

/**
 * 根据 ast 生成代码字符串
 * @param ast
 * @returns
 */
export function generate(ast) {
  const context = createCodegenContext();

  const { push } = context;

  genFunctionPreamble(ast, context);

  const functionName = "render";
  const args = ["_ctx", "_catch"];
  const signature = args.join(", ");

  push(`function ${functionName}(${signature}){`);

  // 函数体
  push("return ");
  genNode(ast.codegenNode, context);
  push("}");
  return {
    code: context.code,
  };
}

/*
import { toDisplayString as _toDisplayString } from "vue";
function render(_ctx, _cache) {
  return _toDisplayString(_ctx.message);
}
*/

function genFunctionPreamble(ast, context) {
  const { push } = context;
  const VueBinging = "vue";

  const aliasHelper = (s) => `${helperMapName[s]} as _${helperMapName[s]}}`;

  // 如果有 helpers 的时候在添加 导入 helpers
  if (ast.helpers.length > 0) {
    push(
      `import { ${ast.helpers.map(aliasHelper).join(", ")} } from ${VueBinging}`
    );
  }
  push("\n");
}

/**
 * 创建代码生成上下文对象
 * @returns
 */
function createCodegenContext(): any {
  const context = {
    code: "",
    push(source) {
      context.code += source;
    },
    helper(key) {
      return `_${helperMapName[key]}`;
    },
  };

  return context;
}

function genNode(node: any, context) {
  switch (node.type) {
    case NodeTypes.TEXT:
      genText(node, context);
      break;
    case NodeTypes.INTERPOLATION:
      genInterpolation(node, context);
      break;
    case NodeTypes.SIMPLE_EXPRESSION:
      genExpression(node, context);
      break;

    default:
      break;
  }
}

function genExpression(node: any, context: any) {
  const { push } = context;
  // 把文件节点的内容放进去
  push(`${node.content}`);
}

function genInterpolation(node: any, context: any) {
  const { push, helper } = context;
  push(`${helper(TO_DISPLAY_STRING)}(`);
  genNode(node.content, context);
  push(")");
}

function genText(node: any, context: any) {
  const { push } = context;
  push(`'${node.content}'`);
}

// 启发，如果整个程序一直需要 处理某个变量，则可以将当前变量提取成一个对象上下文，并提供对应的增删改查的方法
// 诸如 createCodegenContext 这个函数一样
