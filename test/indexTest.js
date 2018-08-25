import { createStore, run } from "../dist/cyclops"

async function runTask() {
  const store = createStore()
  await run({
    argv: false,
    path: `${__dirname}/fixture`,
    store,
    task: "task",
  })
  return store
}

test("run task", async () => {
  const store = await runTask()
  const tasks = store.get("cyclops.tasks")
  const taskIds = Object.keys(tasks)

  expect(store.state).toEqual({
    cyclops: {
      options: {
        _: ["task"],
        path: `${__dirname}/fixture`,
      },
      tasks: {
        [taskIds[0]]: {
          paths: {
            bin: `${__dirname}/fixture/project-a/node_modules/module-a/lib/a.js`,
            pkg: `${__dirname}/fixture/project-a/node_modules/module-a/package.json`,
            project: `${__dirname}/fixture/project-a`,
            task: `${__dirname}/fixture/project-a/node_modules/module-a`,
          },
          ran: true, // set from test task
        },
      },
    },
    glob: {
      cyclops: {
        ignore: ["**/node_modules/**"],
        paths: [
          `${__dirname}/fixture/project-a/package.json`,
        ],
        pattern: `${__dirname}/fixture/**/package.json`,
      },
    },
  })
})
