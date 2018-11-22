import { basename, dirname } from "path"

export async function setTasks(options) {
  const { events, op, store } = options
  const { taskPackagePaths } = store.get("task")

  let taskIndex = 0

  await Promise.all(
    taskPackagePaths.map(pkgPathToTask, {
      events,
      op,
      store,
      taskIndex,
    })
  )

  const tasks = store.get("tasks")
  const taskIds = Object.keys(tasks)

  await Promise.all([
    store.set("task.taskCount", taskIds.length),
    store.set("task.taskIds", taskIds),
  ])
}

async function pkgPathToTask(projectPkgPath) {
  const { store } = this
  const projectPath = dirname(projectPkgPath)
  const taskId = basename(projectPath)
  const props = ["tasks", taskId]

  const { operations } = store.get([
    ...props,
    "packageJson",
  ])

  await store.merge(props, {
    operations,
    projectPath,
    projectPkgPath,
    taskId,
    taskIndex: this.taskIndex,
  })

  this.taskIndex += 1
}
