export const extend = Object.assign;

export const isObject = (obj: any) => obj !== null && typeof obj === "object";

export const isString = (value) => typeof value === "string";

//  把 add  转换成  Add
export const capitalize = (str: string) =>
  str.charAt(0).toUpperCase() + str.slice(1);

// 把 add-foo 转换成 addFoo
export const camelize = (str: string) => {
  return str.replace(/-(\w)/g, function (_, c: string) {
    return c ? c.toUpperCase() : "";
  });
};

export const toHandlerKey = (str: string) =>
  str ? "on" + capitalize(str) : "";

export const hasOwn = (val, key) =>
  Object.prototype.hasOwnProperty.call(val, key);
