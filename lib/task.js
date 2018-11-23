// Packages
import dotArg from "@dot-event/argv"
import dotFs from "@dot-event/fs"
import dotGlob from "@dot-event/glob"
import dotLog from "@dot-event/log"

// Helpers
import { setArgv } from "./task/argv"
import { emitAll } from "./task/emit"
import { setPkgPaths } from "./task/packages"
import { setTasks } from "./task/tasks"

// Composer
export default function task(options) {
  const { events, store } = options

  if (events.ops.has("task")) {
    return options
  }

  dotArg({ events, store })
  dotFs({ events, store })
  dotGlob({ events, store })
  dotLog({ events, store })

  events.onAny({
    task: [setArgv, setPkgPaths, setTasks, emitAll],
  })

  return options
}
