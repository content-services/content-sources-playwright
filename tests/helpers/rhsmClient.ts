import { URL } from "url";
import {
  ExecReturn,
  killContainer,
  runCommand,
  startNewContainer,
} from "./containers";

/**
 * Supported Operating System versions
 */
export type OSVersion = "rhel9" | "rhel8";

/**
 * List of containers to use
 */
const RemoteImages = {
  rhel9: "quay.io/swadeley/ubi9_rhc_prod:latest",
  rhel8: "quay.io/swadeley/ubi8_rhc_prod:latest",
  rhel9dev: "quay.io/swadeley/ubi9_rhc_dev_prod:latest",
};

/**
 * Class to start and manage a registered RHSM/insights client
 */
export class RHSMClient {
  name: string;
  constructor(name: string) {
    this.name = name;
  }

  /**
   * Starts an rhsm client contianer
   * @param version OS and version to boot
   * @returns
   */
  async Boot(version: OSVersion) {
    return startNewContainer(this.name, RemoteImages[version]);
  }

  /**
   * configures this client for stage registration
   * @returns
   */
  async ConfigureForStage() {
    return runCommand(this.name, stageConfigureCommand());
  }

  /**
   * Registers to configured environment using RHC
   * @param activationKey key to register with.  Defaults to $ACTIVATION_KEY_1
   * @param orgId orgId to register with.  Defaults to $ORG_ID_1
   * @returns
   */
  async RegisterRHC(activationKey?: string, orgId?: string) {
    if (!process.env.PROD) {
      await this.ConfigureForStage();
    }
    if (activationKey == undefined) {
      activationKey = process.env.ACTIVATION_KEY_1 || "COULD_NOT_FIND_KEY";
    }
    if (orgId == undefined) {
      orgId = process.env.ORG_ID_1 || "COULD_NOT_FIND_ORG_ID";
    }

    return runCommand(
      this.name,
      ["rhc", "connect", "-a", activationKey, "-o", orgId],
      75000
    );
  }

  /**
   * Register using subscription-manager (won't show up in insights)
   * @param activationKey key to register with.  Defaults to $ACTIVATION_KEY_1
   * @param orgId orgId to register with.  Defaults to $ORG_ID_1
   * @returns
   */
  async RegisterSubMan(activationKey?: string, orgId?: string) {
    if (!process.env.PROD) {
      await this.ConfigureForStage();
    }

    if (activationKey == undefined) {
      activationKey = process.env.ACTIVATION_KEY_1 || "COULD_NOT_FIND_KEY";
    }
    if (activationKey == undefined) {
      orgId = process.env.ORG_ID_1 || "COULD_NOT_FIND_ORG_ID";
    }

    return runCommand(
      this.name,
      [
        "subscription-manager",
        "register",
        "--activationkey",
        activationKey,
        "--org=" + orgId,
        "--name",
        this.name,
      ],
      75000
    );
  }

  /**
   * Run an arbitrary command on the host
   * @param command Command to run
   * @param timeout Timeout in ms to cancel the command, defaults to 500ms
   * @returns
   */
  async Exec(command: string[], timeout?: number): Promise<ExecReturn | void> {
    return runCommand(this.name, command, timeout);
  }

  /**
   * Unregister with subscription-manager
   * @returns
   */
  async Unregister() {
    return runCommand(this.name, ["subscription-manager", "unregister"]);
  }

  /**
   * Unregister and destroy the client container
   */
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
    "--rhsm.baseurl=https://cdn.stage.redhat.com",
  ];
  if (process.env.PROXY !== undefined) {
    const url = new URL(process.env.PROXY);
    command.push("--server.proxy_hostname=" + url.hostname);
    command.push("--server.proxy_port=" + url.port);
  }
  return command;
};
