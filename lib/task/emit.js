// Constants
const phases = ["Setup", "", "Teardown"]

// Helpers
export async function emitAll(options) {
  const { store } = options
  const { taskIds } = store.get("task")

  await Promise.all(taskIds.map(eachTask, options))
}

async function eachTask(taskId) {
  const { events, event, op } = this

  for (const phase of phases) {
    if (events[op + phase]) {
      await events[op + phase](
        props({ event, taskId }),
        taskIdToPayload({ options: this, taskId })
      )
    }
  }
}

function props({ event, taskId }) {
  return [
    ...(event.props || []),
    ...(taskId ? ["tasks", taskId] : []),
  ]
}

function taskIdToPayload({ taskId, options }) {
  const { op, store } = options
  const tasks = store.get("tasks")

  const { opts } = store.get("argv")
  const task = tasks[taskId]

  return {
    ...opts,
    ...task.operations[op],
    cwd: task.projectPath,
    task,
    taskId,
    taskIndex: task.taskIndex,
  }
}
