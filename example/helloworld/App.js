import { h } from '../../lib/vue3-mini-vue.esm.js'

window.self = null
const App = {
  render() {
    console.log(this)
    window.self = this
    return h('div', {}, this.msg)
  },

  setup() {
    return {
      msg: 'hello world -'
    }
  }
}

export default App
