import { h } from '../../lib/vue3-mini-vue.esm.js'
import { Foo } from './Foo.js'

const App = {
  setup() {
    return {}
  },
  render() {
    const app = h('div', {}, "App")
    // 把组件的孩子渲染在 组件里面
    const foo = h(Foo, {}, {
      header: ({ age }) => h('p', {}, 'header' + age),
      footer: () => h('p', {}, 'footer')
    })

    return h('div', {}, [
      app,
      foo
    ])
  }
}

export default App
