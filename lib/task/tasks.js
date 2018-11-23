import { basename, dirname } from "path"

export async function setTasks(options) {
  const { props, store } = options
  const { taskPackagePaths } = store.get([...props, "task"])

  let taskIndex = 0

  await Promise.all(
    taskPackagePaths.map(pkgPathToTask, {
      props,
      store,
      taskIndex,
    })
  )

  const tasks = store.get([...props, "tasks"])
  const taskIds = Object.keys(tasks)

  await Promise.all([
    store.set(
      [...props, "task", "taskCount"],
      taskIds.length
    ),
    store.set([...props, "task", "taskIds"], taskIds),
  ])
}

async function pkgPathToTask(projectPkgPath) {
  const { props, store } = this

  const projectPath = dirname(projectPkgPath)
  const taskId = basename(projectPath)

  const taskProps = [...props, "tasks", taskId]

  const { operations } = store.get([
    ...taskProps,
    "packageJson",
  ])

  await store.merge(taskProps, {
    operations,
    projectPath,
    projectPkgPath,
    taskId,
    taskIndex: this.taskIndex,
  })

  this.taskIndex += 1
}
