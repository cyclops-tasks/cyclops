import { basename, dirname, resolve } from "path"

export async function setPackagePaths(options) {
  const { events, op, store } = options
  const paths = await getProjectPkgPaths(options)
  const newPaths = []

  for (const path of paths) {
    const projectPath = dirname(path)
    const taskId = basename(projectPath)

    const json = await events.fs("setPackagePaths", {
      action: "readJson",
      path,
    })

    const { operations = {} } = json

    const ignore =
      process.env.NODE_ENV !== "test" &&
      operations[op] &&
      operations[op].test

    if (operations[op] && !ignore) {
      await store.set(`tasks.${taskId}.packageJson`, json)
      newPaths.push(path)
    }
  }

  await store.set("task.taskPackagePaths", newPaths)
}

export async function getProjectPkgPaths(options) {
  const { events, path, store } = options
  const { _ } = store.get("argv.opts")

  if (_.length > 0) {
    return _.map(dir => resolve(path, dir, "package.json"))
  } else {
    return await events.glob("getProjectPackagePaths", {
      action: "glob",
      ignore: "**/node_modules/**",
      pattern: `${path}/**/package.json`,
    })
  }
}
