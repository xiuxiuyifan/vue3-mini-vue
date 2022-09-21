import { h } from "../../lib/vue3-mini-vue.esm.js"
import Foo from "./Foo.js"

const App = {
  setup(props) {
    return {
    }
  },
  render() {
    return h('div', {}, [
      h('div', {}, 'App组件'),
      h(Foo, {
        onAdd(a, b) {
          console.log('onAdd触发了', a, b)
        },
        "onAddFoo"() {
          console.log('on-add-foo触发了')
        }
      })
    ])
  }
}

export default App
