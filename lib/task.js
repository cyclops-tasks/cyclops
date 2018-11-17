// Packages
import dotStoreArgv from "@dot-store/argv"
import dotStoreFs from "@dot-store/fs"
import dotStoreGlob from "@dot-store/glob"
import dotStoreLog from "@dot-store/log"

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

  dotStoreArgv({ events, store })
  dotStoreFs({ events, store })
  dotStoreGlob({ events, store })
  dotStoreLog({ events, store })

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
