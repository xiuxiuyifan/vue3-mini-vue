export function shouldUpdateComponent(prevVNode, nextVNode) {
  // 老组件的 props
  const { props: prevProps } = prevVNode;
  // 新组件的 props
  const { props: nextProps } = nextVNode;

  // 遍历新的属性
  for (const key in nextProps) {
    // 如果新属性的值不等于老属性的值，则表示 属性发生变化了，组件需要更新
    if (nextProps[key] !== prevProps[key]) {
      return true;
    }
  }
  // 不需要更新
  return false;
}
