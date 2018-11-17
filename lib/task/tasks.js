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
  const { op, store } = this
  const projectPath = dirname(projectPkgPath)
  const taskId = basename(projectPath)
  const props = ["tasks", taskId]

  const { operations = {} } = await readPackageJson({
    ...this,
    projectPkgPath,
    props,
  })

  if (
    process.env.NODE_ENV !== "test" &&
    operations[op] &&
    operations[op].test
  ) {
    await store.delete(props)
    return
  }

  const { _ } = store.get("argv.opts")

  if (operations[op] || _.length) {
    await store.merge(props, {
      operations,
      projectPath,
      projectPkgPath,
      taskId,
      taskIndex: this.taskIndex,
    })
    this.taskIndex += 1
  } else {
    await store.delete(props)
  }
}

export async function readPackageJson({
  events,
  op,
  projectPkgPath,
  props,
}) {
  return await events.fs([...props, "packageJson"], {
    action: "storeReadJson",
    ensure: true,
    json: { operations: { [op]: {} } },
    path: projectPkgPath,
    spaces: 2,
  })
}

export function runComposer({ composer, events, store }) {
  if (composer) {
    composer({ events, store })
  }
}
