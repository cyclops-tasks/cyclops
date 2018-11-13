// Packages
import dotStoreArgv from "@dot-store/argv"
import dotStoreFs from "@dot-store/fs"
import dotStoreGlob from "@dot-store/glob"

// Helpers
import { setArgv } from "./argv"
import {
  emitAfterAll,
  emitAll,
  emitBeforeAll,
} from "./emit"
import { setPackagePaths } from "./packages"
import { runTaskComposers, setTasks } from "./tasks"

// Composer
export default function cyclops(options) {
  const { events, store } = options

  if (events.ops.has("cyclops")) {
    return options
  }

  dotStoreArgv({ events, store })
  dotStoreFs({ events, store })
  dotStoreGlob({ events, store })

  events.on({
    cyclops: [
      setArgv,
      setPackagePaths,
      setTasks,
      runTaskComposers,
      emitBeforeAll,
      setArgv,
      emitAll,
      emitAfterAll,
    ],
  })

  return options
}
