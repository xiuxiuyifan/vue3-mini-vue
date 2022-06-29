## 集成 test 测试环境

```bash

初始化tsconfig.json 文件

npx tsc --init
```

编写一个 ts 函数，和编写一个测试用例，并让其通过，使用`jest`这个库。

安装 jest

```bash
yarn add --dev jest
```

因为`jest`默认使用的是 commonjs 规范，所以我们需要使用`babel`来进行转换，

```bash
yarn add --dev babel-jest @babel/core @babel/preset-env
```

使用`ts`

```bash
yarn add --dev @babel/preset-typescript


yarn add --dev @types/jest
```

在项目下面新建`babel.config.js`

```js
module.exports = {
  presets: [
    ["@babel/preset-env", { targets: { node: "current" } }],
    "@babel/preset-typescript",
  ],
};
```

编写一个`ts`函数

关闭强制检查`any`

tsconfig.json

```ts
"noImplicitAny": false

"types": ["jest"],
```

编写一个 `index.ts`代码

```ts
export function add(a, b) {
  return a + b;
}
```

编写`index.spec.ts`

```ts
import { add } from "..";

it("init", () => {
  expect(add(1, 4)).toBe(5);
});
```

添加 `script`脚本

```json
  "scripts": {
    "test": "jest"
  },
```
