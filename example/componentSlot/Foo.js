import { h, renderSlots } from "../../lib/vue3-mini-vue.esm.js"

const Foo = {
  setup() {
    return {}
  },
  render() {
    const foo = h('p', {}, 'foo')
    return h('div', {}, [renderSlots(this.$slots, 'header'), foo, renderSlots(this.$slots, 'footer')])
  }
}

export {
  Foo
}
