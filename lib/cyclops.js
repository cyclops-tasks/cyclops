// Packages
import dotStoreArgv from "@dot-store/argv"
import dotStoreFs from "@dot-store/fs"
import dotStoreGlob from "@dot-store/glob"
import dotStoreLog from "@dot-store/log"

// Helpers
import { emitAll } from "./cyclops/emit"
import { setPackagePaths } from "./cyclops/packages"
import { runComposer, setTasks } from "./cyclops/tasks"

// Composer
export default function cyclops(options) {
  const { events, store } = options

  if (events.ops.has("cyclops")) {
    return options
  }

  dotStoreArgv({ events, store })
  dotStoreFs({ events, store })
  dotStoreGlob({ events, store })
  dotStoreLog({ events, store })

  events.onAny({
    cyclops: [
      ({ argv }) => events.argv("argv", { argv }),
      setPackagePaths,
      setTasks,
      runComposer,
      emitAll,
    ],
  })

  return options
}
