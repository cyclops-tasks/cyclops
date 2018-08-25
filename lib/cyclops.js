import { dirname, join } from "path"

import Store from "dot-store"
import argv from "@dot-store/argv"
import glob from "@dot-store/glob"
import { readJson, realpath } from "fs-extra"
import pkgUp from "pkg-up"

export function createStore(store) {
  return argv(glob(store || new Store()))
}

export async function runFromArgv(argv = process.argv) {
  const store = createStore()
  await store.set("argv.cyclops.alias.p", ["path"])
  await store.set("argv.cyclops.raw", argv.slice(2))
  await run(store)
}

export async function run(store = createStore()) {
  const { _, path } = Object.assign(
    {},
    store.get("cyclops.options"),
    store.get("argv.cyclops.parsed")
  )

  let runners = []
  let tasks = {}

  await store.set("glob.cyclops.ignore", [
    "**/node_modules/**",
  ])

  await store.set(
    "glob.cyclops.pattern",
    `${path || process.cwd()}/**/package.json`
  )

  const paths = store.get("glob.cyclops.paths")

  for (const task of _) {
    for (const path of paths) {
      const projectPath = dirname(path)
      const linkPath = join(
        projectPath,
        "node_modules/.bin",
        task
      )

      let binPath

      try {
        binPath = await realpath(linkPath)
      } catch (e) {
        continue
      }

      const pkgPath = await pkgUp(binPath)
      const taskPath = dirname(pkgPath)

      if (!tasks[task]) {
        const pkg = await readJson(pkgPath)

        if (pkg.main) {
          tasks[task] = require(join(taskPath, pkg.main))
        } else {
          continue
        }
      }

      const id = uuid()

      await store.set(`cyclops.tasks.${id}.paths`, {
        bin: binPath,
        link: linkPath,
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

function uuid(a) {
  // prettier-ignore
  return a
    ? (a ^ ((Math.random() * 16) >> (a / 4))).toString(16)
    : ([1e7] + -1e3 + -4e3 + -8e3 + -1e11).replace(
      /[018]/g,
      uuid
    )
}
