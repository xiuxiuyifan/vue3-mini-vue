import { NodeTypes } from "../src/ast";
import { baseParse } from "../src/parse";
import { transform } from "../src/transform";

describe.only("transform", () => {
  it("happy path", () => {
    const ast = baseParse("<div>hi,{{message}}</div>");

    // 遍历当前的 ast 树

    const plugin = (node) => {
      // 在文本节点后天添加一个 mini-vue
      if (node.type === NodeTypes.TEXT) {
        node.content = node.content + " mini-vue";
      }
    };

    transform(ast, {
      nodeTransforms: [plugin],
    });

    const nodeText = ast.children[0].children[0];
    expect(nodeText.content).toBe("hi, mini-vue");
  });
});
