// Constants
const phases = ["Setup", "", "Teardown"]

// Helpers
export async function emitAll(options) {
  const { store } = options
  const { taskIds } = store.get("task")

  await Promise.all(taskIds.map(eachTask, options))
}

async function eachTask(taskId) {
  const { events, op } = this

  for (const phase of phases) {
    if (events[op + phase]) {
      await events[op + phase](
        taskIdToPayload({ options: this, taskId })
      )
    }
  }
}

function taskIdToPayload({ taskId, options }) {
  const { event, op, store } = options
  const tasks = store.get("tasks")

  const { opts } = store.get("argv")
  const task = tasks[taskId]

  return {
    ...opts,
    ...task.operations[op],
    cwd: task.projectPath,
    ns: [
      ...(taskId ? ["tasks", taskId] : []),
      ...(event.props || []),
    ],
    task,
    taskId,
    taskIndex: task.taskIndex,
  }
}
