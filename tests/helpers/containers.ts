import { time } from "console";
import Dockerode, { Container } from "dockerode";
import { PassThrough } from "stream";
import { finished } from "stream/promises";

var Docker = require("dockerode");

const util = require("util");
const exec = util.promisify(require("child_process").exec);

const docker = (): Dockerode => {
  return new Docker({ socketPath: process.env.DOCKER_SOCKET! });
};

/**
 * starts a container, killing the existing one if its present
 *
 * @param containerName customizable name ("my_container)" to give to your container.  Could be the test name, or something linking it to the test.
 * @param imageName full image name and tag:  "localhost/my_image:latest"
 */
export const startNewContainer = async (
  containerName: string,
  imageName: string
) => {
  await killContainer(containerName);
  await startContainer(containerName, imageName);
};

async function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Starts a container, should not already be running, image should already be pulled
 * @param containerName customizable name ("my_container)" to give to your container.  Could be the test name, or something linking it to the test.
 * @param imageName full image name and tag:  "localhost/my_image:latest"
 * @returns
 */
const startContainer = async (containerName: string, imageName: string) => {
  await pullImage(imageName);
  console.log("starting container " + containerName);
  const container = await docker().createContainer({
    Image: imageName,
    name: containerName,
    HostConfig: {
      Privileged: true,
    },
  });
  return container?.start();
};

/**
 * Pulls an image and waits for it to finish, up to 5 seconds
 *
 * @param imageName the full image name (localhost/my-image:latest)
 * @param retryCount number of times to retry the pull until its successful (defaults to 3)
 * @param waitTime amount of time to wait for each pull
 */
const pullImage = async (
  imageName: string,
  retryCount?: number,
  waitTime?: number
) => {
  var sleepTime = waitTime || 10000;
  if (retryCount == 0) {
    return;
  }
  await docker().pull(imageName);
  while (sleepTime > 0) {
    if (await imagePresent(imageName)) {
      return true;
    }
    await sleep(1000);
    sleepTime -= 1000;
  }
  await pullImage(imageName, (retryCount || 3) - 1, waitTime);
};

const imagePresent = async (imageName: string): Promise<boolean> => {
  const images = await docker().listImages();
  for (var image of images) {
    if ((image.RepoTags ? image.RepoTags : []).includes(imageName)) {
      return true;
    }
  }
  return false;
};

const waitForContainer = async (name: string): Promise<Container | void> => {
  var container = await getContainer(name);
  var waited = 10;
  while (container == undefined && waited > 0) {
    waited -= 1;
    await sleep(500);
    container = await getContainer(name);
  }
  return container;
};

const waitForContainerRunning = async (
  name: string
): Promise<Container | void> => {
  var container = await getContainerInfo(name);
  var waited = 10;
  while (container?.State !== "running" && waited > 0) {
    waited -= 1;
    await sleep(500);
    container = await getContainerInfo(name);
  }
};

const getContainerInfo = async (name: string) => {
  const containers = await docker().listContainers({ all: true });

  for (var contInfo of containers) {
    if (contInfo.Names.includes("/" + name)) {
      return contInfo;
    }
  }
  return undefined;
};

const getContainer = async (name: string): Promise<Container | void> => {
  const cInfo = await getContainerInfo(name);
  if (cInfo !== undefined) {
    return docker().getContainer(cInfo.Id);
  }
};

/**
 * Kills the running container and deletes it
 * @param containerName the user provided container to kill
 * @returns
 */
export const killContainer = async (containerName: string) => {
  const info = await getContainerInfo(containerName);
  const c = await getContainer(containerName);
  if (info?.State == "running") {
    await c?.kill();
  }
  await c?.remove();
};

export interface ExecReturn {
  stdout?: string;
  stderr?: string;
  exitCode?: number | null;
}

//
// Defaults to a 500 ms timeout unless timeout is specified

/**
 * Runs a non-interactive command and returns stdout, stderr, and the exit code
 *
 * @param containerName the human readable container name to execute the command
 * @param command the command to execute
 * @param timeout_ms timeout (in milliseconds) the command should execute in (defaults to 500ms)
 * @returns ExecReturn containing stdout, stderr, exitCode
 */
export const runCommand = async (
  containerName: string,
  command: string[],
  timeout_ms?: number
): Promise<ExecReturn | void> => {
  console.log("Running " + command + " on " + containerName);

  const controller = new AbortController();
  const signal = controller.signal;

  const timeout = setTimeout(() => {
    console.error("Timeout reached for command (" + command + ")");
    controller.abort();
  }, timeout_ms || 500);

  const c = await getContainer(containerName);
  const exec = await c?.exec({
    Cmd: command,
    AttachStdout: true,
    AttachStderr: true,
    Privileged: true,
    abortSignal: signal,
  });
  if (exec == undefined) {
    return undefined;
  }

  const execStream = await exec?.start({
    abortSignal: signal,
  });

  clearTimeout(timeout);
  if (execStream == undefined) {
    return undefined;
  }

  const stdoutStream = new PassThrough();
  const stderrStream = new PassThrough();

  docker().modem.demuxStream(execStream, stdoutStream, stderrStream);

  execStream.resume();
  await finished(execStream);

  const stderr = stderrStream.read() as Buffer | undefined;
  const stdout = stdoutStream.read() as Buffer | undefined;
  const execInfo = await exec.inspect();

  return {
    exitCode: execInfo.ExitCode,
    stderr: stderr?.toString(),
    stdout: stdout?.toString(),
  };
};
