// Constants
const phases = ["Setup", "", "Teardown"]

// Helpers
export async function emitAll(options) {
  const { events, op, props } = options
  const { taskIds } = events.get([...props, "task"])

  if (events[op + "SetupOnce"]) {
    await events[op + "SetupOnce"](
      taskProps({ props }),
      payload(options)
    )
  }

  await Promise.all(taskIds.map(eachTask, options))

  if (events[op + "TeardownOnce"]) {
    await events[op + "TeardownOnce"](
      taskProps({ props }),
      payload(options)
    )
  }
}

async function eachTask(taskId) {
  const { events, props, op } = this

  for (const phase of phases) {
    if (events[op + phase]) {
      await events[op + phase](
        taskProps({ props, taskId }),
        payload.bind({ taskId })(this)
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

function payload(options) {
  const { events, op, props } = options
  const { opts } = events.get("argv")

  if (this) {
    const { taskId } = this

    const tasks = events.get([...props, "tasks"])
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
  } else {
    return opts
  }
}
