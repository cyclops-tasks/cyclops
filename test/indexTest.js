import { run } from "../dist/cyclops"

test("run task", async () => {
  const store = await run({
    _: ["task"],
    path: `${__dirname}/fixture`,
  })

  const tasks = store.get("cyclops.tasks")

  expect(Object.keys(tasks).length).toBe(1)

  for (const id in tasks) {
    expect(tasks[id].ran).toBe(true)
  }
})
