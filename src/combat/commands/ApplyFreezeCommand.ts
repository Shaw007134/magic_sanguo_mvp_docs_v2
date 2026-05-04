import { ApplyControlStatusCommand, type ControlStatusTarget } from "./ApplyControlStatusCommand.js";

export class ApplyFreezeCommand extends ApplyControlStatusCommand {
  constructor(target: ControlStatusTarget, durationTicks: number) {
    super({
      kind: "FREEZE",
      commandName: "ApplyFreeze",
      target,
      durationTicks
    });
  }
}
