import { basename, dirname } from "path"

export async function setTasks(options) {
  const { events, op, store } = options
  const pkgPaths = store.get("cyclops.packagePaths")

  let taskIndex = 0

  await Promise.all(
    pkgPaths.map(pkgPathToTask, {
      events,
      op,
      store,
      taskIndex,
    })
  )

  const tasks = store.get("tasks")
  const taskIds = Object.keys(tasks)

  await Promise.all([
    store.set("taskCount", taskIds.length),
    store.set("taskIds", taskIds),
  ])
}

async function pkgPathToTask(projectPkgPath) {
  const { op, store } = this
  const projectPath = dirname(projectPkgPath)
  const taskId = basename(projectPath)
  const props = ["tasks", taskId]

  const { cyclops = {} } = await readPackageJson({
    ...this,
    projectPkgPath,
    props,
  })

  if (
    process.env.NODE_ENV !== "test" &&
    cyclops[op] &&
    cyclops[op].test
  ) {
    await store.delete(props)
    return
  }

  const { _ } = store.get("argv.opts")

  if (cyclops[op] || _.length) {
    await store.merge(props, {
      cyclops,
      cyclopsIds: Object.keys(cyclops),
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
  store,
}) {
  await events.fs([...props, "packageJson"], {
    ensure: true,
    json: { cyclops: { [op]: {} } },
    options: { spaces: 2 },
    path: projectPkgPath,
    readJson: true,
  })

  return store.get([...props, "packageJson"])
}

export function runComposer({ composer, events, store }) {
  if (composer) {
    composer({ events, store })
  }
}
