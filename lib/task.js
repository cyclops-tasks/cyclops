// Packages
import dotArg from "@dot-event/argv"
import dotFs from "@dot-event/fs"
import dotGlob from "@dot-event/glob"
import dotLog from "@dot-event/log"

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
  dotLog({ events, store })

  events.onAny({
    task: [
      ({ argv }) => events.argv("argv", { argv }),
      setPackagePaths,
      setTasks,
      runComposer,
      emitAll,
    ],
  })

  return options
}
