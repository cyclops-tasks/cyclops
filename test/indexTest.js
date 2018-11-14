import dotEvent from "dot-event"
import dotStore from "dot-store"

import cyclops from "../dist/cyclops"

let events, store

beforeEach(() => {
  events = dotEvent()
  store = dotStore(events)

  cyclops({ events, store })
})

async function runTask() {
  await events.cyclops({
    argv: [],
    composer: ({ store }) => {
      store.set("cyclops.composer.called", true)
    },
    path: `${__dirname}/fixture`,
    task: "fixture-tasks",
  })
}

test("emits events", async () => {
  const actions = []

  events.on({
    "after.cyclops.fixture-tasks.task": () =>
      actions.push("afterTask"),
    "before.cyclops.fixture-tasks.task": () =>
      actions.push("beforeTask"),
    "cyclops.fixture-tasks.patch": () =>
      actions.push("patch"),
    "cyclops.fixture-tasks.task": () =>
      actions.push("task"),
  })

  await runTask()

  expect(actions).toEqual([
    "beforeTask",
    "task",
    "afterTask",
  ])
})

test("sets state", async () => {
  await runTask()

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
