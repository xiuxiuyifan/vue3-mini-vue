/**
 * 根据 ast 生成代码字符串
 * @param ast
 * @returns
 */
export function generate(ast) {
  const context = createCodegenContext();

  const { push } = context;

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
  };

  return context;
}

function genNode(node: any, context) {
  const { push } = context;
  // 把文件节点的内容放进去
  push(`'${node.content}'`);
}

// 启发，如果整个程序一直需要 处理某个变量，则可以将当前变量提取成一个对象上下文，并提供对应的增删改查的方法
// 诸如 createCodegenContext 这个函数一样
