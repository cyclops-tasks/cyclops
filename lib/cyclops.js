import { basename, dirname, join } from "path"

// Packages
import dotArgv from "@dot-store/argv"
import dotGlob from "@dot-store/glob"
import { readJson, realpath } from "fs-extra"
import pkgUp from "pkg-up"

export async function cyclops({
  argv,
  events,
  path,
  store,
  task: manualTask,
}) {
  dotArgv({ events, store })
  dotGlob({ events, store })

  await Promise.all([
    setArgv({ argv, events, store }),
    store.set("path", path),
    events.glob("packageJsonPaths", {
      options: { ignore: "**/node_modules/**" },
      pattern: `${path}/**/package.json`,
    }),
  ])

  const { _ } = store.get("argv")
  const task = manualTask || _[0]

  if (!task) {
    throw new Error("task not specified")
  }

  const pkgPaths = store.get("glob.packageJsonPaths")
  const paths = await taskPaths({ pkgPaths, task })
  const taskStoreComposer = await taskStoreComposerFn(paths)

  taskStoreComposer({ events, store })

  await events.emit("beforeAllTasks")
  await setArgv({ argv, events, store })

  const tasks = paths.reduce((memo, path, index) => {
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
    store.set("taskCount", paths.length),
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

async function taskStoreComposerFn(paths) {
  for (const path of paths) {
    const { taskPath, taskPkgPath } = path
    const pkg = await readJson(taskPkgPath)

    if (pkg.main) {
      const fn = require(join(taskPath, pkg.main))
      return fn.default ? fn.default : fn
    }
  }
}

async function taskPaths({ pkgPaths, task }) {
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

  return paths.reduce(
    (memo, path) => (path ? memo.concat([path]) : memo),
    []
  )
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
