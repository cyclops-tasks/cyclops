import { basename, dirname } from "path"

export async function setTasks(options) {
  const { events, store, task } = options
  const pkgPaths = store.get("cyclops.packagePaths")

  const tasks = taskIndices(
    removeUndefined(
      await Promise.all(
        pkgPaths.map(pkgPathToTask, { events, store, task })
      )
    )
  )

  const taskIds = Object.keys(tasks)

  await Promise.all([
    store.set("cyclops.taskCount", taskIds.length),
    store.set("cyclops.taskIds", taskIds),
    store.set("cyclops.tasks", tasks),
  ])
}

async function pkgPathToTask(projectPkgPath) {
  const { events, store, task } = this

  const projectPath = dirname(projectPkgPath)
  const taskId = basename(projectPath)

  await events.fs(`readJson.cyclops.${taskId}`, {
    ensure: true,
    json: { cyclops: { [task]: {} } },
    options: { spaces: 2 },
    path: projectPkgPath,
  })

  const { cyclops = {} } = store.get(
    `fs.readJson.cyclops.${taskId}`
  )

  const { _ } = store.get("argv.cyclops")

  if (cyclops[task] || _.length) {
    return {
      cyclops,
      cyclopsIds: Object.keys(cyclops),
      projectPath,
      projectPkgPath,
      task,
      taskId,
    }
  }
}

export function removeUndefined(tasks) {
  return tasks.reduce(
    (memo, task) => (task ? memo.concat([task]) : memo),
    []
  )
}

export function taskIndices(tasks) {
  return tasks.reduce((memo, task, index) => {
    memo[task.taskId] = {
      ...task,
      taskIndex: index,
    }
    return memo
  }, {})
}

export function runTaskComposers({
  composer,
  events,
  store,
  task,
}) {
  const { taskIds, tasks } = store.get("cyclops")

  if (composer) {
    composer({ events, store })
  }

  for (const taskId of taskIds) {
    const { cyclopsIds } = tasks[taskId]

    for (const lib of cyclopsIds) {
      if (lib !== task || !composer) {
        require(lib)({ events, store })
      }
    }
  }
}
