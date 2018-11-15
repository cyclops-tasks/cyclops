import { basename, dirname } from "path"

export async function setTasks(options) {
  const { events, op, store } = options
  const pkgPaths = store.get("cyclops.packagePaths")

  const tasks = taskIndices(
    removeUndefined(
      await Promise.all(
        pkgPaths.map(pkgPathToTask, { events, op, store })
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
  const { events, op, store } = this

  const projectPath = dirname(projectPkgPath)
  const taskId = basename(projectPath)

  await events.fs(`readJson.cyclops.${taskId}`, {
    ensure: true,
    json: { cyclops: { [op]: {} } },
    options: { spaces: 2 },
    path: projectPkgPath,
  })

  const { cyclops = {} } = store.get(
    `fs.readJson.cyclops.${taskId}`
  )

  const { _ } = store.get("argv.opts")

  if (cyclops[op] || _.length) {
    return {
      cyclops,
      cyclopsIds: Object.keys(cyclops),
      projectPath,
      projectPkgPath,
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

export function runComposer({ composer, events, store }) {
  if (composer) {
    composer({ events, store })
  }
}
