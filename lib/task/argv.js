export async function setArgv({ argv, events, props }) {
  await events.argv(props, { argv })
}
