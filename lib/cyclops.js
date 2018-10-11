import { basename, dirname, join } from "path"

// Packages
import dotArgv from "@dot-store/argv"
import dotGlob from "@dot-store/glob"
import { readJson, realpath } from "fs-extra"
import pkgUp from "pkg-up"

export default function cyclops(options) {
  const { events, store } = options

  dotArgv({ events, store })
  dotGlob({ events, store })

  events.on({
    cyclops: [
      { globPackageJson, setArgv },
      setTask,
      setTaskPaths,
      runTaskComposer,
      () => events.emit("beforeAllTasks"),
      setArgv,
      runTasks,
    ],
  })

  return options
}

async function globPackageJson({ events, path }) {
  await events.glob("packageJson", {
    options: { ignore: "**/node_modules/**" },
    pattern: `${path}/**/package.json`,
  })
}

async function setTask({ store, task }) {
  const { _ } = store.get("argv")
  await store.set("task", task || _[0])

  if (!store.get("task")) {
    throw new Error("task not specified")
  }
}

async function setTaskPaths({ store }) {
  const pkgPaths = store.get("glob.packageJson")
  const task = store.get("task")

  const paths = await Promise.all(
    pkgPaths.map(async projectPkgPath => {
      const projectPath = dirname(projectPkgPath)
      const taskBinPath = await findBin({
        projectPath,
        task,
      })

      if (!taskBinPath) {
        return
      }

      const taskPkgPath = await pkgUp(taskBinPath)
      const taskPath = dirname(taskPkgPath)

      return {
        projectPath,
        projectPkgPath,
        taskBinPath,
        taskPath,
        taskPkgPath,
      }
    })
  )

  const taskPaths = paths.reduce(
    (memo, path) => (path ? memo.concat([path]) : memo),
    []
  )

  await store.set("taskPaths", taskPaths)
}

async function runTaskComposer({ events, store }) {
  const taskPaths = store.get("taskPaths")
  const taskComposer = await taskComposerFn(taskPaths)
  taskComposer({ events, store })
}

async function runTasks({ events, store }) {
  const taskPaths = store.get("taskPaths")
  const tasks = taskPaths.reduce((memo, path, index) => {
    const taskId = basename(path.projectPath)
    memo[taskId] = {
      ...path,
      taskId,
      taskIndex: index,
      taskLeader: index === 0,
    }
    return memo
  }, {})

  await Promise.all([
    store.set("tasks", tasks),
    store.set("taskCount", taskPaths.length),
    store.set("taskIds", Object.keys(tasks)),
  ])

  await Promise.all(
    Object.keys(tasks).map(
      async taskId =>
        await events.emit("startTask", { taskId })
    )
  )
}

async function setArgv({ argv, events, store }) {
  await events.argv({
    argv,
    options: store.get("argvOptions"),
  })
}

async function taskComposerFn(paths) {
  for (const path of paths) {
    const { taskPath, taskPkgPath } = path
    const pkg = await readJson(taskPkgPath)

    if (pkg.main) {
      const fn = require(join(taskPath, pkg.main))
      return fn.default ? fn.default : fn
    }
  }
}

async function findBin(options, ext = "") {
  const { projectPath, task } = options

  const linkPath = join(
    projectPath,
    "node_modules/.bin",
    task + ext
  )

  try {
    return await realpath(linkPath)
  } catch (e) {
    if (ext === "") {
      return await findBin(options, "-tasks")
    }
  }
}
