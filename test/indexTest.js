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
      store.set("cyclops.composer.called", true)
    },
    path: `${__dirname}/fixture`,
    task: "fixture-tasks",
  })

  return { events, store }
}

test("call composer", async () => {
  const { store } = await runTask()

  expect(store.state).toMatchObject({
    argv: { cyclops: { _: [] } },
    cyclops: {
      composer: { called: true },
      packagePaths: [
        `${__dirname}/fixture/project-a/package.json`,
      ],
      taskCount: 1,
      taskIds: ["project-a"],
      tasks: {
        "project-a": {
          cyclops: { "fixture-tasks": {} },
          cyclopsIds: ["fixture-tasks"],
          projectPath: `${__dirname}/fixture/project-a`,
          projectPkgPath: `${__dirname}/fixture/project-a/package.json`,
          task: "fixture-tasks",
          taskId: "project-a",
          taskIndex: 0,
        },
      },
    },
    fs: {
      readJson: {
        cyclops: {
          "project-a": { cyclops: { "fixture-tasks": {} } },
        },
      },
    },
    glob: {
      cyclops: [
        `${__dirname}/fixture/project-a/package.json`,
      ],
    },
  })
})
