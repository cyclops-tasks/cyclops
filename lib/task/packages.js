import { basename, dirname, resolve } from "path"

export async function setPkgPaths(options) {
  const { events, op, props } = options

  const { _ } = events.get("argv.opts")

  const paths = await getProjectPkgPaths(options)
  const newPaths = []

  for (const path of paths) {
    const projectPath = dirname(path)
    const taskId = basename(projectPath)

    const taskProps = [...props, "tasks", taskId]

    const json = await events.fsReadJson(taskProps, {
      ensure: _.length,
      json: { operations: { [op]: {} } },
      path,
    })

    const { operations = {} } = json

    const ignore =
      process.env.NODE_ENV !== "test" &&
      operations[op] &&
      operations[op].test

    if (operations[op] && !ignore) {
      await events.set([...taskProps, "packageJson"], json)
      newPaths.push(path)
    }
  }

  await events.set(
    [...props, "task", "taskPackagePaths"],
    newPaths
  )
}

export async function getProjectPkgPaths(options) {
  const { events, path, props } = options
  const { _ } = events.get("argv.opts")

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
