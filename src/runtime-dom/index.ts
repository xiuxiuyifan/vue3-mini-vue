import { createRenderer } from "../runtime-core";

function createElement(type) {
  return document.createElement(type);
}

function patchProp(el, key, prevVal, nextVal) {
  const isOn = (key: string) => /^on[A-Z]/.test(key);
  if (isOn(key)) {
    const event = key.slice(2).toLowerCase();
    el.addEventListener(event, nextVal);
  } else {
    // 删除属性
    if (nextVal === undefined || nextVal === null) {
      el.removeAttribute(key);
    } else {
      // 修改和添加属性
      el.setAttribute(key, nextVal);
    }
  }
}

/**
 *
 * @param child
 * @param parent
 * @param anchor 参照点位 null 的话就是向后插入，如果不为 null 的话，则表示向参照点前面插入新元素
 */
function insert(child, parent, anchor) {
  parent.insertBefore(child, anchor || null);
}

/**
 * 设置元素文本内容
 * @param el
 * @param text
 */
function setElementText(el, text) {
  el.textContent = text;
}

/**
 * 删除DOM 元素的子节点
 * @param child
 */
function remove(child) {
  const parent = child.parentNode;
  if (parent) {
    parent.removeChild(child);
  }
}

const renderer: any = createRenderer({
  createElement,
  patchProp,
  insert,
  setElementText,
  remove,
});

export function createApp(...args) {
  return renderer.createApp(...args);
}

export * from "../runtime-core";
