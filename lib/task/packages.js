import { resolve } from "path"

export async function setPackagePaths(options) {
  const { events, path, store } = options
  const { _ } = store.get("argv.opts")

  if (_.length > 0) {
    await store.set(
      "task.taskPackagePaths",
      _.map(dir => resolve(path, dir, "package.json"))
    )
  } else {
    await events.glob("task.taskPackagePaths", {
      action: "storeGlob",
      ignore: "**/node_modules/**",
      pattern: `${path}/**/package.json`,
    })
  }
}
