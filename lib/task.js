// Packages
import dotArg from "dot-arg"
import dotFs from "dot-fs-extra"
import dotGlob from "dot-glob"
import dotLogger from "dot-logger"

// Helpers
import { emitAll } from "./task/emit"
import { setPackagePaths } from "./task/packages"
import { runComposer, setTasks } from "./task/tasks"

// Composer
export default function task(options) {
  const { events, store } = options

  if (events.ops.has("task")) {
    return options
  }

  dotArg({ events, store })
  dotFs({ events, store })
  dotGlob({ events, store })
  dotLogger({ events, store })

  events.onAny({
    task: [
      ({ arg }) => events.arg("arg", { arg }),
      setPackagePaths,
      setTasks,
      runComposer,
      emitAll,
    ],
  })

  return options
}
