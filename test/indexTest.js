import dotEvent from "dot-event"
import dotStore from "dot-store"

import cyclops from "../dist/cyclops"

async function runTask() {
  const events = dotEvent()
  const store = dotStore(events)

  cyclops({ events, store })

  await events.cyclops({
    argv: [],
    composer: ({ store }) => {
      store.set("composer.called", true)
    },
    path: `${__dirname}/fixture`,
    task: "fixture-tasks",
  })

  return { events, store }
}

test("call composer", async () => {
  const { store } = await runTask()

  expect(store.state).toMatchObject({
    argv: {},
    composer: {
      called: true,
    },
    glob: {
      packageJson: [
        `${__dirname}/fixture/project-a/package.json`,
      ],
    },
    taskCount: 1,
    taskIds: ["project-a"],
  })
})
