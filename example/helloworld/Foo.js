import { h } from "../../lib/vue3-mini-vue.esm.js"

const Foo = {
  setup(props) {
    console.log(props)
    props.count = 100
  },
  render() {
    return h('div', {}, "foo:" + this.count)
  }
}

export { Foo }
