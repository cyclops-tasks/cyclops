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
              ...options,
              cyclopsId,
              taskId,
            })
          })
        )
      }

      if (eachTask) {
        await eachTask({ ...options, taskId })
      }
    })
  )
}

export const emitAll = eachCyclopsTask.bind({
  eachCyclops: async options => {
    const { cyclopsId, events, task } = options

    for (const action of patchActions) {
      if (cyclopsId !== task) {
        await events.cyclops(
          [cyclopsId, action],
          taskIdToPayload(options)
        )
      }
    }
  },
  eachTask: async options => {
    const { events, task } = options

    for (const action of taskActions) {
      await events.cyclops(
        [task, action],
        taskIdToPayload(options)
      )
    }
  },
})

function taskIdToPayload(options) {
  const { argv, cyclopsId, store, taskId } = options
  const { tasks } = store.get("cyclops")

  return {
    argv,
    cyclopsId,
    task: tasks[taskId],
    taskId,
  }
}
