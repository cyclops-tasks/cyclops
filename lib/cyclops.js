// Packages
import dotStoreArgv from "@dot-store/argv"
import dotStoreFs from "@dot-store/fs"
import dotStoreGlob from "@dot-store/glob"

// Helpers
import { setArgv } from "./argv"
import { setPackagePaths } from "./packages"
import { runTaskComposers, setTasks } from "./tasks"

// Constants
const patchActions = ["beforePatch", "patch", "afterPatch"]
const taskActions = ["beforeTask", "task", "afterTask"]

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
      beforeAll,
      setArgv,
      emitAll,
      afterAll,
    ],
  })

  return options
}

async function beforeAll({ events }) {
  await events.cyclops("beforeAll")
}

async function emitAll({ events, store, task }) {
  const { taskIds, tasks } = store.get("cyclops")

  await Promise.all(
    taskIds.map(async taskId => {
      const { cyclopsIds } = tasks[taskId]
      const payload = { task: tasks[taskId], taskId }

      await Promise.all(
        cyclopsIds.map(async lib => {
          for (const action of patchActions) {
            if (lib !== task) {
              await events.cyclops([lib, action], payload)
            }
          }
        })
      )

      for (const action of taskActions) {
        await events.cyclops([task, action], payload)
      }
    })
  )
}

async function afterAll({ events }) {
  await events.cyclops("afterAll")
}
