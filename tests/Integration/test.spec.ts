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
  await startNewContainer(
    "my_container",
    "quay.io/swadeley/ubi9_rhc_prod:latest"
  );

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

test("Test2 container", async ({}, testInfo) => {
  testInfo.setTimeout(5 * 60 * 1000); // Five minutes

  const client = new RHSMClient("TemplateTest");

  await client.Boot("rhel9");
  const reg = await client.RegisterSubMan("satellite-clone-dolly", "5894300");
  if (reg?.exitCode != 0) {
    console.log(reg?.stdout);
    console.log(reg?.stderr);
  }
  expect(reg?.exitCode).toBe(0);

  const notExist = await client.Exec(["rpm", "-q", "vim-enhanced"]);
  expect(notExist?.exitCode).not.toBe(0);

  const yumInstall = await client.Exec(
    ["yum", "install", "-y", "vim-enhanced"],
    60000
  );
  expect(yumInstall?.exitCode).toBe(0);

  const exist = await client.Exec(["rpm", "-q", "vim-enhanced"]);
  expect(exist?.exitCode).toBe(0);

  await client.Destroy();
});
