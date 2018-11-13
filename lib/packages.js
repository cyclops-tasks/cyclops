import { resolve } from "path"

export async function setPackagePaths(options) {
  const { store } = options
  const { _ } = store.get("argv.cyclops")

  if (_.length > 0) {
    await store.set(
      "cyclops.packagePaths",
      _.map(dir => resolve(dir, "package.json"))
    )
  } else {
    await globPackages(options)
    await store.set(
      "cyclops.packagePaths",
      store.get("glob.cyclops")
    )
  }
}

export async function globPackages({
  events,
  path,
  store,
}) {
  const { _ } = store.get("argv.cyclops")

  if (_.length === 0) {
    await events.glob("cyclops", {
      options: { ignore: "**/node_modules/**" },
      pattern: `${path}/**/package.json`,
    })
  }
}
