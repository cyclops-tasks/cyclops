import { h, render, Component, Text } from "ink"
import { List, ListItem } from "ink-checkbox-list"
import Spinner from "ink-spinner"
import Table from "ink-table"
import TextAnimation from "ink-text-animation"

export function inkRender({ store }) {
  if (process.env.EVENTS) {
    return () => {}
  } else {
    return render(<Ink store={store} />)
  }
}

export class Ink extends Component {
  constructor(props, context) {
    super(props, context)

    this.components = []

    const { store } = props

    this.addOff = store.on("Component.add", ({ event }) => {
      const component = event.args[0]

      this.components = this.components.concat([
        component({
          Component,
          List,
          ListItem,
          Spinner,
          Table,
          Text,
          TextAnimation,
          event,
          h,
          render,
          store,
        }),
      ])

      this.setState({ random: Math.random() })
    })

    this.removeOff = store.on("Component.remove", () => {
      this.components = this.components.slice(0, -1)
      this.setState({ random: Math.random() })
    })
  }

  componentWillUnmount() {
    this.addOff()
    this.removeOff()
  }

  render() {
    return (
      <div>
        {this.components[this.components.length - 1]}
      </div>
    )
  }
}
