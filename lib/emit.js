// Constants
const patchActions = ["beforePatch", "patch", "afterPatch"]
const taskActions = ["beforeTask", "task", "afterTask"]

// Helpers
async function eachCyclopsTask(options) {
  const { eachCyclops, eachTask } = this
  const { store } = options
  const { taskIds, tasks } = store.get("cyclops")

  await Promise.all(
    taskIds.map(async taskId => {
      if (eachCyclops) {
        const { cyclopsIds } = tasks[taskId]

        await Promise.all(
          cyclopsIds.map(async cyclopsId => {
            await eachCyclops({
              cyclopsId,
              options,
              taskId,
            })
          })
        )
      }

      if (eachTask) {
        await eachTask({ options, taskId })
      }
    })
  )
}

export const emitAll = eachCyclopsTask.bind({
  eachCyclops: async ({ cyclopsId, options, taskId }) => {
    const { events, store, task } = options

    for (const action of patchActions) {
      if (cyclopsId !== task) {
        await events.cyclops(
          [cyclopsId, action],
          taskIdToPayload({ store, taskId })
        )
      }
    }
  },
  eachTask: async ({ options, taskId }) => {
    const { events, store, task } = options

    for (const action of taskActions) {
      await events.cyclops(
        [task, action],
        taskIdToPayload({ store, taskId })
      )
    }
  },
})

async function taskIdToPayload({ store, taskId }) {
  const { tasks } = store.get("cyclops")
  return {
    task: tasks[taskId],
    taskId,
  }
}
