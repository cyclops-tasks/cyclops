import { composeStore } from "../dist/cyclops"

async function runTask() {
  const store = composeStore()
  await store.cyclops({
    argv: ["task"],
    path: `${__dirname}/fixture`,
  })
  return store
}

test("run task", async () => {
  const store = await runTask()
  const tasks = store.get("tasks")
  const taskIds = Object.keys(tasks)

  expect(store.state).toEqual({
    argv: {
      _: ["task"],
    },
    packageJsonPaths: [
      `${__dirname}/fixture/project-a/package.json`,
    ],
    path: `${__dirname}/fixture`,
    tasks: {
      [taskIds[0]]: {
        projectPath: `${__dirname}/fixture/project-a`,
        projectPkgPath: `${__dirname}/fixture/project-a/package.json`,
        ran: true,
        taskBinPath: `${__dirname}/fixture/project-a/node_modules/module-a/lib/a.js`,
        taskPath: `${__dirname}/fixture/project-a/node_modules/module-a`,
        taskPkgPath: `${__dirname}/fixture/project-a/node_modules/module-a/package.json`,
      },
    },
  })
})
