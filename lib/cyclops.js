import { dirname, join } from "path"

import dotStore from "dot-store"
import argv from "@dot-store/argv"
import glob from "@dot-store/glob"
import { readJson, realpath } from "fs-extra"
import pkgUp from "pkg-up"

export function composeStore(store = dotStore()) {
  store.withOp("cyclops").on(cyclops)
  return argv(glob(store))
}

export async function cyclops({ event, store }) {
  const [{ argv, path }] = event.args
  const tasks = {}

  let runners = []

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
  const packageJsonPaths = store.get("packageJsonPaths")

  for (const task of _) {
    for (const jsonPath of packageJsonPaths) {
      const projectPath = dirname(jsonPath)
      const binPath = await findBin({ projectPath, task })

      if (!binPath) {
        continue
      }

      const pkgPath = await pkgUp(binPath)
      const taskPath = dirname(pkgPath)

      if (!tasks[task]) {
        const pkg = await readJson(pkgPath)

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

      await store.set(`tasks.${id}`, {
        binPath,
        pkgPath,
        projectPath,
        taskPath,
      })

      const runner = () => {
        return tasks[task]({ id, store })
      }
      runners = runners.concat(runner)
    }
  }

  const promises = runners.map(fn => fn())
  await Promise.all(promises)

  return store
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
