export async function setArgv({ argv, events, store }) {
  await events.argv("cyclops", {
    argv,
    options: store.get("cyclops.argvOptions"),
  })
}
