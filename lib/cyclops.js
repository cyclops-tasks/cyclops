import { dirname, join } from "path"

// Packages
import dotStore from "dot-store"
import argv from "@dot-store/argv"
import glob from "@dot-store/glob"
import { readJson, realpath } from "fs-extra"
import pkgUp from "pkg-up"

// Helpers
import { inkRender } from "./ink"

export function composeStore(store = dotStore()) {
  store.withOp("cyclops").on(cyclops)
  return argv(glob(store))
}

export async function cyclops({ event, store }) {
  const [{ argv, path, task: manualTask }] = event.args

  await Promise.all([
    store.argv("argv", argv),
    store.set("path", path),
    store.glob(
      "packageJsonPaths",
      `${path}/**/package.json`,
      {
        ignore: "**/node_modules/**",
      }
    ),
  ])

  const { _ } = store.get("argv")
  const pkgPaths = store.get("packageJsonPaths")
  const task = manualTask || _[0]
  const paths = await taskPaths({ pkgPaths, task })
  const taskStoreComposer = await taskStoreComposerFn(paths)

  taskStoreComposer(store)

  const exit = inkRender({ store })
  store.onEmitted("finishTasks", exit)

  const tasks = paths.reduce((memo, path, index) => {
    const taskId = uuid()
    memo[taskId] = {
      ...path,
      taskCount: paths.length,
      taskId,
      taskIndex: index,
      taskLeader: index === 0,
    }
    return memo
  }, {})

  await store
    .withOptions({ taskIds: Object.keys(tasks), tasks })
    .emit("startTasks")
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

function uuid(a) {
  // prettier-ignore
  return a
    ? (a ^ ((Math.random() * 16) >> (a / 4))).toString(16)
    : ([1e7] + -1e3 + -4e3 + -8e3 + -1e11).replace(
      /[018]/g,
      uuid
    )
}
