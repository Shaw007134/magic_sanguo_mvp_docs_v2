import { ApplyControlStatusCommand, type ControlStatusTarget } from "./ApplyControlStatusCommand.js";

export class ApplyHasteCommand extends ApplyControlStatusCommand {
  constructor(target: ControlStatusTarget, percent: number, durationTicks: number) {
    super({
      kind: "HASTE",
      commandName: "ApplyHaste",
      target,
      percent,
      durationTicks
    });
  }
}
