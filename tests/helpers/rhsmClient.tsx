import { URL } from "url";
import { killContainer, runCommand, startNewContainer } from "./containers";

export type OSVersion = "rhel9" | "rhel8";

const RemoteImages = {
  rhel9: "quay.io/jlsherri/client-rhel9",
  rhel8: "localhost/client-rhel9",
};

export class RHSMClient {
  name: string;
  constructor(name: string) {
    this.name = name;
  }

  async Boot(version: OSVersion) {
    return startNewContainer(this.name, RemoteImages[version]);
  }

  async ConfigureForStage() {
    return runCommand(this.name, stageConfigureCommand());
  }

  async Register(activationKey?: string, orgId?: string) {
    if (!process.env.PROD) {
      await this.ConfigureForStage();
    }

    if (activationKey == undefined) {
      activationKey = process.env.ACTIVATION_KEY_1 || "COULD_NOT_FIND_KEY";
    }
    if (activationKey == undefined) {
      orgId = process.env.ORG_ID_1 || "COULD_NOT_FIND_ORG_ID";
    }

    return runCommand(this.name, [
      "subscription-manager",
      "register",
      "--activationkey",
      activationKey,
      "--org=" + orgId,
      "--name",
      this.name,
    ]);
  }

  async Unregister() {
    return runCommand(this.name, ["subscription-manager", "unregister"]);
  }

  async Destroy() {
    const cmd = await this.Unregister();
    console.log(cmd?.stdout);
    console.log(cmd?.stderr);
    return killContainer(this.name);
  }
}

const stageConfigureCommand = (): string[] => {
  var command = [
    "subscription-manager",
    "config",
    "--server.hostname=subscription.rhsm.stage.redhat.com",
    "--server.port=443",
    "--server.prefix=/subscription",
    "--server.insecure=0",
  ];
  if (process.env.PROXY !== undefined) {
    const url = new URL(process.env.PROXY);
    command.push("--server.proxy_hostname=" + url.hostname);
    command.push("--server.proxy_port=" + url.port);
  }
  return command;
};
