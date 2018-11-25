// Packages
import dotEvent from "dot-event"

// Helpers
import dotTask from "../"

// Variables
let events

beforeEach(() => {
  events = dotEvent()

  events.setOps(
    "fixture",
    "fixtureSetup",
    "fixtureTeardown"
  )

  dotTask({ events })
})

async function runTask(...argv) {
  events.onAny("fixture", () =>
    events.set("test.composer", true)
  )

  await events.task({
    argv,
    op: "fixture",
    path: `${__dirname}/fixture`,
  })
}

test("emits events", async () => {
  const actions = []

  events.onAny({
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

  events.onAny({
    fixture: options =>
      expect(Object.keys(options)).toEqual(
        expect.arrayContaining([
          "_",
          "event",
          "events",
          "hello",
        ])
      ),
  })

  await runTask("--hello")
})

test("sets state", async () => {
  await runTask()

  expect(events.get()).toMatchObject({
    argv: { opts: { _: [] }, raw: [] },
    task: {
      taskIds: ["project-a"],
      taskPackagePaths: [
        `${__dirname}/fixture/project-a/package.json`,
      ],
    },
    tasks: {
      "project-a": {
        operations: { fixture: { test: true } },
        packageJson: {
          operations: { fixture: { test: true } },
        },
        projectPath: `${__dirname}/fixture/project-a`,
        projectPkgPath: `${__dirname}/fixture/project-a/package.json`,
        taskId: "project-a",
        taskIndex: 0,
      },
    },
    test: { composer: true },
  })
})
