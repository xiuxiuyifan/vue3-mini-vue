import { h } from '../../lib/vue3-mini-vue.esm.js'


const App = {
  render() {
    return h('div', {
      id: 'root',
      class: ['red', 'hard']
    }, [
      h('p', {}, 'A'),
      h('p', {}, 'B'),
      h('p', {}, 'C'),
    ])
  },

  setup() {
    return {
      msg: 'hello world'
    }
  }
}

export default App
