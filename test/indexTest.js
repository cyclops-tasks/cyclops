import { composeStore } from "../dist/cyclops"

async function runTask() {
  const store = composeStore()
  await store.cyclops({
    argv: ["task"],
    path: `${__dirname}/fixture`,
  })
  return store
}

test("call composer", async () => {
  const store = await runTask()

  expect(store.state).toEqual({
    argv: {
      _: ["task"],
    },
    composer: {
      called: true,
    },
    packageJsonPaths: [
      `${__dirname}/fixture/project-a/package.json`,
    ],
    path: `${__dirname}/fixture`,
    taskCounter: 0,
  })
})
