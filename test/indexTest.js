import dotEvent from "dot-event"
import dotStore from "dot-store"

import { cyclops } from "../dist/cyclops"

async function runTask() {
  const events = dotEvent()
  const store = dotStore(events)

  await cyclops({
    argv: ["task"],
    events,
    path: `${__dirname}/fixture`,
    store,
  })

  return { events, store }
}

test("call composer", async () => {
  const { store } = await runTask()

  expect(store.state).toMatchObject({
    argv: {
      _: ["task"],
    },
    composer: {
      called: true,
    },
    glob: {
      packageJsonPaths: [
        `${__dirname}/fixture/project-a/package.json`,
      ],
    },
    path: `${__dirname}/fixture`,
  })
})
