import { basename, dirname } from "path"

export async function setTasks(options) {
  const { events, props } = options
  const { taskPackagePaths } = events.get([
    ...props,
    "task",
  ])

  await Promise.all(
    taskPackagePaths.map(pkgPathToTask, {
      events,
      props,
    })
  )

  const tasks = events.get([...props, "tasks"])
  const taskIds = Object.keys(tasks)

  await Promise.all([
    events.set(
      [...props, "task", "taskCount"],
      taskIds.length
    ),
    events.set([...props, "task", "taskIds"], taskIds),
  ])
}

async function pkgPathToTask(projectPkgPath, taskIndex) {
  const { events, props } = this

  const projectPath = dirname(projectPkgPath)
  const taskId = basename(projectPath)

  const taskProps = [...props, "tasks", taskId]

  const { operations } = events.get([
    ...taskProps,
    "packageJson",
  ])

  await events.merge(taskProps, {
    operations,
    projectPath,
    projectPkgPath,
    taskId,
    taskIndex,
  })
}
