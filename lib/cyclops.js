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
  const runners = []
  const tasks = {}

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
    store.set("taskCounter", 0),
  ])

  const { _ } = store.get("argv")
  const pkgPaths = store.get("packageJsonPaths")
  const task = manualTask || _[0]

  for (const projectPkgPath of pkgPaths) {
    const projectPath = dirname(projectPkgPath)
    const taskBinPath = await findBin({ projectPath, task })

    if (!taskBinPath) {
      continue
    }

    const taskPkgPath = await pkgUp(taskBinPath)
    const taskPath = dirname(taskPkgPath)

    if (!tasks[task]) {
      const pkg = await readJson(taskPkgPath)

      if (pkg.main) {
        tasks[task] = require(join(taskPath, pkg.main))
        if (tasks[task].default) {
          tasks[task] = tasks[task].default
        }
      } else {
        continue
      }
    }

    const id = uuid()
    const taskData = {
      projectPath,
      projectPkgPath,
      taskBinPath,
      taskPath,
      taskPkgPath,
    }

    await store.set(`tasks.${id}`, taskData)

    const runner = async ({ count, index }) => {
      await tasks[task]({
        event,
        store,
        task: taskData,
        taskCount: count,
        taskId: id,
        taskIndex: index,
        taskLeader: index === 0,
      })
      if (index > 0) {
        await completeTask({ id, store })
      }
      if (store.get("taskCounter") === count - 1) {
        await store.emit("followerTasksComplete")
        await completeTask({ id, store })
      }
    }

    runners.push(runner)
  }

  const exit = inkRender({ store })

  const promises = runners.map((fn, i) =>
    fn({ count: runners.length, index: i })
  )
  await Promise.all(promises)

  setTimeout(exit, 1000)
}

async function completeTask({ id, store }) {
  await Promise.all([
    store.set(`tasks.${id}.complete`, true),
    store.set(
      "taskCounter",
      () => store.get("taskCounter") + 1
    ),
  ])
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
