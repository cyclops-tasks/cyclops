import { basename, dirname, resolve } from "path"

// Packages
import dotStoreArgv from "@dot-store/argv"
import dotStoreFs from "@dot-store/fs"
import dotStoreGlob from "@dot-store/glob"

// Events composer
export default function cyclops(options) {
  const { events, store } = options

  if (events.ops.has("cyclops")) {
    return options
  }

  dotStoreArgv({ events, store })
  dotStoreFs({ events, store })
  dotStoreGlob({ events, store })

  events.on({
    cyclops: [
      setArgv,
      globPackages,
      setPackagePaths,
      runTaskComposer,
      async () =>
        await events.cyclops("beforeSetTaskPaths"),
      setTaskPaths,
      async () => await events.cyclops("beforeRunTasks"),
      setArgv,
      runTasks,
    ],
  })

  return options
}

// Helpers
async function setArgv({ argv, events, store }) {
  await events.argv({
    argv,
    options: store.get("argvOptions"),
  })
}

async function globPackages({ events, path, store }) {
  const { _ } = store.get("argv")

  if (_.length === 0) {
    await events.glob("packageJson", {
      options: { ignore: "**/node_modules/**" },
      pattern: `${path}/**/package.json`,
    })
  }
}

async function setPackagePaths({ store }) {
  const { _ } = store.get("argv")

  if (_.length > 0) {
    await store.set(
      "packagePaths",
      _.map(dir => resolve(dir, "package.json"))
    )
  } else {
    await store.set(
      "packagePaths",
      store.get("glob.packageJson")
    )
  }
}

async function setTaskPaths(options) {
  const { events, store, task } = options
  const pkgPaths = store.get("packagePaths")

  const paths = await Promise.all(
    pkgPaths.map(async projectPkgPath => {
      const projectPath = dirname(projectPkgPath)
      const taskId = basename(projectPath)

      await events.fs(`readJson.${taskId}`, {
        path: projectPkgPath,
      })

      const {
        cyclops = {},
        dependencies = {},
        devDependencies = {},
      } = store.get(`fs.readJson.${taskId}`)

      if (
        cyclops[task] ||
        dependencies[task] ||
        devDependencies[task]
      ) {
        return { projectPath, projectPkgPath, taskId }
      }
    })
  )

  const taskPaths = paths.reduce(
    (memo, path) => (path ? memo.concat([path]) : memo),
    []
  )

  await store.set("taskPaths", taskPaths)
}

function runTaskComposer({ composer, events, store }) {
  composer({ events, store })
}

async function runTasks({ events, store }) {
  const taskPaths = store.get("taskPaths")
  const tasks = taskPaths.reduce((memo, path, index) => {
    memo[path.taskId] = {
      ...path,
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
        await events.cyclops("startTask", { taskId })
    )
  )
}
