import dotEvent from "dot-event"
import dotStore from "dot-store"

import cyclops from "../dist/cyclops"

let events, store

beforeEach(() => {
  events = dotEvent()
  store = dotStore(events)

  events.setOps(
    "fixture",
    "fixtureSetup",
    "fixtureTeardown"
  )

  cyclops({ events, store })
})

async function runTask(...argv) {
  await events.cyclops({
    argv,
    composer: ({ store }) => {
      store.set("composer.called", true)
    },
    op: "fixture",
    path: `${__dirname}/fixture`,
  })
}

test("emits events", async () => {
  const actions = []

  events.on({
    "after.fixture": () => actions.push("after"),
    "before.fixture": () => actions.push("before"),
    fixture: () => actions.push("run"),
    fixtureSetup: () => actions.push("setup"),
    fixtureTeardown: () => actions.push("teardown"),
  })

  await runTask()

  expect(actions).toEqual([
    "setup",
    "before",
    "run",
    "after",
    "teardown",
  ])
})

test("passes options to events", async () => {
  expect.assertions(1)

  events.on({
    fixture: options =>
      expect(Object.keys(options)).toEqual(
        expect.arrayContaining([
          "_",
          "event",
          "events",
          "hello",
          "store",
          "task",
        ])
      ),
  })

  await runTask("--hello")
})

test("sets state", async () => {
  await runTask()

  expect(store.state).toMatchObject({
    argv: { opts: { _: [] }, raw: [] },
    composer: { called: true },
    cyclops: {
      packagePaths: [
        `${__dirname}/fixture/project-a/package.json`,
      ],
      taskCount: 1,
      taskIds: ["project-a"],
      tasks: {
        "project-a": {
          cyclops: { fixture: {} },
          cyclopsIds: ["fixture"],
          projectPath: `${__dirname}/fixture/project-a`,
          projectPkgPath: `${__dirname}/fixture/project-a/package.json`,
          taskId: "project-a",
          taskIndex: 0,
        },
      },
    },
    fs: {
      readJson: {
        cyclops: {
          "project-a": { cyclops: { fixture: {} } },
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
