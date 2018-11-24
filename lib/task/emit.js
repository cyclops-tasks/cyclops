// Constants
const phases = ["Setup", "", "Teardown"]

// Helpers
export async function emitAll(options) {
  const { props, store } = options
  const { taskIds } = store.get([...props, "task"])

  await Promise.all(taskIds.map(eachTask, options))
}

async function eachTask(taskId) {
  const { events, props, op } = this

  for (const phase of phases) {
    if (events[op + phase]) {
      await events[op + phase](
        taskProps({ props, taskId }),
        taskIdToPayload.bind({ taskId })(this)
      )
    }
  }
}

function taskProps({ props, taskId }) {
  return [
    ...(props || []),
    ...(taskId ? ["tasks", taskId] : []),
  ]
}

function taskIdToPayload(options) {
  const { taskId } = this
  const { op, props, store } = options

  const tasks = store.get([...props, "tasks"])

  const { opts } = store.get("argv")
  const task = tasks[taskId]

  const { operations } = task
  const operation = operations[op]

  const alias = operation.alias
    ? operations[operation.alias]
    : {}

  return {
    ...alias,
    ...operation,
    ...opts,
    cwd: task.projectPath,
  }
}
