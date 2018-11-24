export async function setArgv({ argv, events }) {
  await events.argv({ argv })
}
