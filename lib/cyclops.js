import { dirname, join } from "path"

import Store from "dot-store"
import argv from "@dot-store/argv"
import glob from "@dot-store/glob"
import { readJson, realpath } from "fs-extra"
import pkgUp from "pkg-up"

export function createStore(store) {
  return argv(glob(store || new Store()))
}

export async function run({
  argv = true,
  path = process.cwd(),
  store = createStore(),
  task,
} = {}) {
  await updateOptions({ argv, path, store, task })

  const { _ } = store.get("cyclops.options")

  let runners = []
  let tasks = {}

  await store.set("glob.cyclops.ignore", [
    "**/node_modules/**",
  ])

  await store.set(
    "glob.cyclops.pattern",
    `${path}/**/package.json`
  )

  const paths = store.get("glob.cyclops.paths")

  for (const task of _) {
    for (const path of paths) {
      const projectPath = dirname(path)
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

      await store.set(`cyclops.tasks.${id}.paths`, {
        bin: binPath,
        pkg: pkgPath,
        project: projectPath,
        task: taskPath,
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

async function updateFromArgv(store) {
  await store.set("argv.cyclops.alias.p", ["path"])
  await store.set("argv.cyclops.raw", process.argv.slice(2))

  const parsed = store.get("argv.cyclops.parsed")
  await store.merge("cyclops.options", parsed)
}

async function updateOptions({ argv, path, store, task }) {
  if (argv) {
    await store.set("cyclops.options.argv", argv)
    await updateFromArgv(store)
  }

  if (path) {
    await store.set("cyclops.options.path", path)
  }

  if (task) {
    await store.merge("cyclops.options._", [task])
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
