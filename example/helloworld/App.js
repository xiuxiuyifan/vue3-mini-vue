import { h } from '../../lib/vue3-mini-vue.esm.js'


const App = {
  render() {
    return h('div', {}, this.msg)
  },

  setup() {
    return {
      msg: 'hello world -hhhh'
    }
  }
}

export default App
