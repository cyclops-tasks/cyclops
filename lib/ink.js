import { h, render, Component } from "ink"
import Spinner from "ink-spinner"

export function inkRender({ store }) {
  return render(<Ink store={store} />)
}

export class Ink extends Component {
  constructor(props, context) {
    super(props, context)

    this.components = []

    const { store } = props

    this.off = store.on("Component", ({ event }) => {
      const { component } = event.args[0]

      this.components = this.components.concat([
        component({
          Component,
          Spinner,
          event,
          h,
          render,
          store,
        }),
      ])

      this.setState({ random: Math.random() })
    })
  }

  componentWillUnmount() {
    this.off()
  }

  render() {
    return <div>{this.components}</div>
  }
}
