import Store from "dot-store"
import argv from "@dot-store/argv"
import glob from "@dot-store/glob"
import { readJson, realpath } from "fs-extra"
import { dirname, join } from "path"
import pkgUp from "pkg-up"
import uuid from "uuid/v1"

const store = argv(glob(new Store()))

export async function runFromArgv(argv = process.argv) {
  await store.set("argv.cyclops.alias.p", ["path"])
  await store.set("argv.cyclops.raw", argv.slice(2))
  await run(store.get("argv.cyclops.parsed"))
}

export async function run(options = {}) {
  const { _, path } = options

  let runners = []
  let tasks = {}

  await store.set("cyclops.options", options)

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
