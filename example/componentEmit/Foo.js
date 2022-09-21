import { h } from "../../lib/vue3-mini-vue.esm.js"

const Foo = {
  setup(props, { emit }) {
    const handleClick = () => {
      console.log('emit add')
      emit('add', 1, 2)
      emit('add-foo')
    }
    return {
      handleClick
    }
  },
  render() {
    return h('button', {
      onClick: () => {
        this.handleClick()
      }
    }, 'emit')
  }
}

export default Foo
