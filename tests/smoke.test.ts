import { describe, expect, it } from "vitest";

import { getLogicTicksPerSecond, PROJECT_NAME } from "../src/index.js";

describe("project skeleton", () => {
  it("exposes the project name", () => {
    expect(PROJECT_NAME).toBe("Magic Sanguo");
  });

  it("keeps the documented logic tick rate visible", () => {
    expect(getLogicTicksPerSecond()).toBe(60);
  });
});
