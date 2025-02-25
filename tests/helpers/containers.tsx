import Dockerode, { Container } from "dockerode";
import { PassThrough } from "stream";
import { finished } from "stream/promises";

var Docker = require("dockerode");

const util = require("util");
const exec = util.promisify(require("child_process").exec);

const dockerHost = () => {
  return process.env.DOCKER_SOCKET!;
};

const docker = (): Dockerode => {
  return new Docker({ socketPath: dockerHost() });
};

export const startContainer = async (
  containerName: string,
  imageName: string
) => {
  console.log("starting container " + containerName);
  const container = await docker().createContainer({
    Image: imageName,
    name: containerName,
  });
  return container?.start();
};

/*
 * starts a container and kills one if it already exists with the same name
 */
export const startNewContainer = async (
  containerName: string,
  imageName: string
) => {
  await killContainer(containerName);
  return await startContainer(containerName, imageName);
  //await waitForContainer(containerName)
};

async function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

const waitForContainer = async (name: string): Promise<Container | void> => {
  var container = await getContainer(name);
  var waited = 10;
  while (container == undefined && waited > 0) {
    waited -= 1;
    await sleep(1000);
    container = await getContainer(name);
  }
  return container;
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

export const killContainer = async (containerName: string) => {
  const info = await getContainerInfo(containerName);
  const c = await getContainer(containerName);
  if (info?.State == "running") {
    await c?.kill();
  }
  return c?.remove();
};

interface ExecReturn {
  stdout?: string;
  stderr?: string;
  exitCode?: number | null;
}

// Runs a non-interactive command and returns stdout, stderr, and the exit code
export const runCommand = async (
  containerName: string,
  command: string[]
): Promise<ExecReturn | void> => {
  console.log("Running " + command + " on " + containerName);
  const c = await getContainer(containerName);
  const exec = await c?.exec({
    Cmd: command,
    AttachStdout: true,
    AttachStderr: true,
  });
  if (exec == undefined) {
    return undefined;
  }

  const execStream = await exec?.start({});
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
