// Helpers
export async function emitAll(options) {
  const { store } = options
  const { taskIds } = store.get("cyclops")

  await Promise.all(taskIds.map(eachTask, options))
}

async function eachTask(taskId) {
  const { events, op } = this

  await events[op](
    taskIdToPayload({ options: this, taskId })
  )
}

function taskIdToPayload({ taskId, options }) {
  const { store } = options
  const { tasks } = store.get("cyclops")
  const argv = store.get("argv.cyclops")

  return {
    ...argv,
    task: tasks[taskId],
    taskId,
  }
}
