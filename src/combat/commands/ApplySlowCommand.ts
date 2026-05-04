import { ApplyControlStatusCommand, type ControlStatusTarget } from "./ApplyControlStatusCommand.js";

export class ApplySlowCommand extends ApplyControlStatusCommand {
  constructor(target: ControlStatusTarget, percent: number, durationTicks: number) {
    super({
      kind: "SLOW",
      commandName: "ApplySlow",
      target,
      percent,
      durationTicks
    });
  }
}
