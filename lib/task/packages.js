import { basename, dirname, resolve } from "path"

export async function setPkgPaths(options) {
  const { events, op, props, store } = options
  const paths = await getProjectPkgPaths(options)
  const newPaths = []

  for (const path of paths) {
    const projectPath = dirname(path)
    const taskId = basename(projectPath)

    const taskProps = [...props, "tasks", taskId]

    const json = await events.fs(taskProps, {
      action: "readJson",
      path,
    })

    const { operations = {} } = json

    const ignore =
      process.env.NODE_ENV !== "test" &&
      operations[op] &&
      operations[op].test

    if (operations[op] && !ignore) {
      await store.set([...taskProps, "packageJson"], json)
      newPaths.push(path)
    }
  }

  await store.set(
    [...props, "task", "taskPackagePaths"],
    newPaths
  )
}

export async function getProjectPkgPaths(options) {
  const { events, path, props, store } = options
  const { _ } = store.get([...props, "argv", "opts"])

  if (_.length > 0) {
    return _.map(dir => resolve(path, dir, "package.json"))
  } else {
    return await events.glob(props, {
      action: "glob",
      ignore: "**/node_modules/**",
      pattern: `${path}/**/package.json`,
    })
  }
}
