import {
  killContainer,
  runCommand,
  startNewContainer,
} from "../helpers/containers";
import { test, expect } from "@playwright/test";
import { RHSMClient } from "../helpers/rhsmClient";

async function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

test("Test container", async ({}) => {
  await startNewContainer("my_container", "localhost/client-rhel9");

  const stream = await runCommand("my_container", ["ls", "-l"]);
  if (stream != undefined) {
    console.log(stream.stdout);
    console.log(stream.stderr);
    console.log(stream.exitCode);
  }

  const stream2 = await runCommand("my_container", ["ls", "-z"]);
  if (stream2 != undefined) {
    console.log(stream2.stdout);
    console.log(stream2.stderr);
    console.log(stream2.exitCode);
  }

  await killContainer("my_container");
});

test("Test2 container", async ({}) => {
  const client = new RHSMClient("TemplateTest");

  await client.Boot("rhel9");
  const reg = await client.Register("satellite-clone-dolly", "5894300");
  if (reg?.exitCode != 0) {
    console.log(reg?.stdout);
    console.log(reg?.stderr);
  }
  expect(reg?.exitCode).toBe(0);

  await client.Destroy();
});
